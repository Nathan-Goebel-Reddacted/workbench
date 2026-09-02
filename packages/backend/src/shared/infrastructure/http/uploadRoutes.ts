import { FastifyPluginAsync } from 'fastify';
import { writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireRole } from './roleGuard.js';
import { MINDMAP_SUFFIX } from '@shared/domain/valueObject/documentType';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '../../../../uploads');

// Les vidéos dépassent systématiquement le seuil qui suffisait aux images.
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

// Un mindmap réécrit est un document JSON, pas un média : le plafond des vidéos n'a
// aucune raison de s'appliquer ici.
const MAX_MINDMAP_BYTES = 5 * 1024 * 1024;

// Seuls les fichiers produits par POST /uploads sont réécrivables, et leur nom est un
// UUID généré par le serveur. Ce motif est ce qui interdit à un client de désigner un
// chemin arbitraire — il ne laisse passer ni séparateur, ni '..', ni extension libre.
const REWRITABLE_FILENAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mindmap\.json$/;

// Liste blanche : le fichier déposé est ensuite servi sans authentification sous
// /uploads/, sur l'origine de l'API. Une extension exécutable par le navigateur y ferait
// du domaine un hébergeur de script. `.svg` en fait partie — c'est un document XML qui
// porte du JavaScript — et reste donc dehors, malgré son statut d'image ailleurs.
const ALLOWED_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.avif',
    '.mp4',
    '.m4v',
    '.webm',
    '.ogv',
    '.ogg',
    '.mov',
    '.mkv',
    '.avi',
    '.wmv',
    '.flv',
    '.mpeg',
    '.mpg',
    '.3gp',
    '.ts',
    '.pdf',
    MINDMAP_SUFFIX,
]);

// `lastIndexOf('.')` ne verrait que `.json` d'un `.mindmap.json` : le suffixe composé,
// qui est ce qui distingue un mindmap d'un JSON quelconque, doit être traité à part.
function extensionOf(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith(MINDMAP_SUFFIX)) return MINDMAP_SUFFIX;

    const dotIndex = filename.lastIndexOf('.');
    return dotIndex !== -1 ? filename.slice(dotIndex).toLowerCase() : '';
}

export const uploadRoutes: FastifyPluginAsync = async app => {
    app.post(
        '/uploads',
        {
            preHandler: requireRole('edit'),
            config: { rateLimit: { max: 60, timeWindow: '15 minutes' } },
        },
        async (req, reply) => {
            const data = await req.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
            if (!data) return reply.status(400).send({ error: 'No file provided' });

            // Rejeté avant toute lecture du flux : inutile de bufferiser 200 Mo pour découvrir
            // ensuite que l'extension n'est pas servable.
            const extension = extensionOf(data.filename);
            if (!ALLOWED_EXTENSIONS.has(extension)) {
                return reply.status(415).send({ error: `Unsupported file type: ${extension || 'none'}` });
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

            const filename = `${crypto.randomUUID()}${extension}`;

            await mkdir(UPLOADS_DIR, { recursive: true });
            await writeFile(join(UPLOADS_DIR, filename), buffer);

            return reply.status(201).send({ url: `/uploads/${filename}` });
        },
    );

    // Réécriture en place d'un mindmap. C'est ce qui permet de ré-éditer un mindmap sans
    // changer son URL : le Document qui le référence, et les sections de layout qui
    // pointent dessus, restent valides.
    //
    // Seule route qui écrit sur un chemin désigné par le client, d'où trois verrous :
    // le rôle d'édition, le motif de nom ci-dessus, et l'exigence que le fichier existe
    // déjà — une création passe par POST, qui seul attribue les noms.
    app.put<{ Params: { filename: string }; Body: unknown }>(
        '/uploads/:filename',
        {
            preHandler: requireRole('edit'),
            bodyLimit: MAX_MINDMAP_BYTES,
            schema: {
                body: {
                    type: 'object',
                    required: ['version', 'nodes', 'edges'],
                    properties: {
                        version: { type: 'number' },
                        nodes: { type: 'array' },
                        edges: { type: 'array' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { filename } = req.params;
            if (!REWRITABLE_FILENAME.test(filename)) {
                return reply.status(400).send({ error: 'Only mindmap files can be rewritten' });
            }

            const target = join(UPLOADS_DIR, filename);
            try {
                await access(target);
            } catch {
                return reply.status(404).send({ error: 'File not found' });
            }

            await writeFile(target, JSON.stringify(req.body));

            return reply.status(200).send({ url: `/uploads/${filename}` });
        },
    );
};
