import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { ListMediaImagesQuery } from '@contexts/contentEditor/application/query/listMediaImages/listMediaImagesQuery';
import { requirePrivateRead } from '@shared/infrastructure/http/roleGuard';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const contentEditorRoutes: FastifyPluginAsync<Opts> = async (app, { queryBus }) => {
    // Bibliothèque d'images déjà attachées aux projets / features / tickets,
    // proposée par la bibliothèque de médias de l'éditeur.
    app.get('/media/images', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListMediaImagesQuery('image'));
        return reply.send(result);
    });

    // Même arborescence que /media/images, filtrée sur les documents vidéo,
    // proposée par la bibliothèque de médias de l'éditeur.
    app.get('/media/videos', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListMediaImagesQuery('video'));
        return reply.send(result);
    });

    // Même arborescence, filtrée sur les mindmaps créés dans l'application.
    app.get('/media/mindmaps', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListMediaImagesQuery('mindmap'));
        return reply.send(result);
    });

    // Tous les documents affichables : image, vidéo, mindmap et PDF, que rend un Media.
    app.get('/media/documents', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListMediaImagesQuery('document'));
        return reply.send(result);
    });
};
