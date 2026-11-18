import { FastifyPluginAsync } from 'fastify';
import { requireRole } from './roleGuard.js';
import { CommandBus } from '@shared/application/command/commandBus';
import { StoreUploadCommand } from '@shared/application/command/storeUpload/storeUploadCommand';
import { RewriteMindmapCommand } from '@shared/application/command/rewriteMindmap/rewriteMindmapCommand';
import { UnsupportedFileTypeException } from '@shared/domain/exception/unsupportedFileType';
import { MAX_UPLOAD_BYTES, storableExtension } from '@shared/domain/valueObject/uploadFilename';
import { UserRole } from '@shared/domain/valueObject/userRole';

// Un mindmap réécrit est un document JSON, pas un média : le plafond des vidéos n'a
// aucune raison de s'appliquer ici.
export const MAX_MINDMAP_BYTES = 5 * 1024 * 1024;

export const mindmapSchema = {
    type: 'object',
    required: ['version', 'nodes', 'edges'],
    properties: {
        version: { type: 'number' },
        nodes: { type: 'array' },
        edges: { type: 'array' },
    },
} as const;

export const uploadRoutes: FastifyPluginAsync<{ commandBus: CommandBus }> = async (app, { commandBus }) => {
    app.post(
        '/uploads',
        {
            preHandler: requireRole(UserRole.EDIT),
            config: { rateLimit: { max: 60, timeWindow: '15 minutes' } },
        },
        async (req, reply) => {
            const data = await req.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
            if (!data) return reply.status(400).send({ error: 'No file provided' });

            // Rejeté avant toute lecture du flux : inutile de bufferiser 200 Mo pour découvrir
            // ensuite que l'extension n'est pas servable.
            try {
                storableExtension(data.filename);
            } catch (error) {
                if (error instanceof UnsupportedFileTypeException) {
                    return reply.status(415).send({ error: error.message });
                }
                throw error;
            }

            // toBuffer() rejette dès que le flux dépasse fileSize : rien n'est écrit sur disque.
            let buffer: Buffer;
            try {
                buffer = await data.toBuffer();
            } catch (error) {
                if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
                    return reply.status(413).send({
                        error: `File too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB)`,
                    });
                }
                throw error;
            }

            const url = await commandBus.dispatch<StoreUploadCommand, string>(
                new StoreUploadCommand(data.filename, buffer),
            );
            return reply.status(201).send({ url });
        },
    );

    // Réécriture en place d'un mindmap. C'est ce qui permet de ré-éditer un mindmap sans
    // changer son URL : le Document qui le référence, et les sections de layout qui
    // pointent dessus, restent valides.
    //
    // Seule route qui écrit sur un chemin désigné par le client, d'où trois verrous :
    // le rôle d'édition, le motif de nom (`assertStoredMindmapName`), et l'exigence que le fichier existe
    // déjà — une création passe par POST, qui seul attribue les noms.
    app.put<{ Params: { filename: string }; Body: unknown }>(
        '/uploads/:filename',
        {
            preHandler: requireRole(UserRole.EDIT),
            bodyLimit: MAX_MINDMAP_BYTES,
            schema: { body: mindmapSchema },
        },
        async (req, reply) => {
            const url = await commandBus.dispatch<RewriteMindmapCommand, string>(
                new RewriteMindmapCommand(req.params.filename, req.body),
            );
            return reply.status(200).send({ url });
        },
    );
};
