import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreatePageLayoutCommand } from '@contexts/contentEditor/application/command/createPageLayout/createPageLayoutCommand';
import { AddSectionCommand } from '@contexts/contentEditor/application/command/addSection/addSectionCommand';
import { RemoveSectionCommand } from '@contexts/contentEditor/application/command/removeSection/removeSectionCommand';
import { MoveSectionCommand } from '@contexts/contentEditor/application/command/moveSection/moveSectionCommand';
import { UpdateSectionContentCommand } from '@contexts/contentEditor/application/command/updateSectionContent/updateSectionContentCommand';
import { GetPageLayoutByIdQuery } from '@contexts/contentEditor/application/query/getPageLayoutById/getPageLayoutByIdQuery';
import { GetPageLayoutByRefQuery } from '@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefQuery';
import { ListMediaImagesQuery } from '@contexts/contentEditor/application/query/listMediaImages/listMediaImagesQuery';
import { requirePrivateRead, requireRole } from '@shared/infrastructure/http/roleGuard';
import { PageType } from '@contexts/contentEditor/domain/valueObject/pageType';
import { SectionType } from '@contexts/contentEditor/domain/valueObject/sectionType';
import { UserRole } from '@shared/domain/valueObject/userRole';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const contentEditorRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    // Bibliothèque d'images déjà attachées aux projets / features / tickets,
    // proposée au widget image de l'éditeur.
    app.get('/media/images', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListMediaImagesQuery('image'));
        return reply.send(result);
    });

    // Même arborescence que /media/images, filtrée sur les documents vidéo,
    // proposée au widget vidéo de l'éditeur.
    app.get('/media/videos', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListMediaImagesQuery('video'));
        return reply.send(result);
    });

    // Même arborescence, filtrée sur les mindmaps créés dans l'application.
    app.get('/media/mindmaps', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListMediaImagesQuery('mindmap'));
        return reply.send(result);
    });

    // Tous les documents affichables : image, vidéo, mindmap et PDF. Sert au widget
    // document comme au carrousel, qui rendent les mêmes formes.
    app.get('/media/documents', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new ListMediaImagesQuery('document'));
        return reply.send(result);
    });

    app.get<{ Querystring: { pageType: string; pageRef: string } }>('/page-layouts/by-ref', async (req, reply) => {
        const result = await queryBus.dispatch(new GetPageLayoutByRefQuery(req.query.pageType, req.query.pageRef));
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/page-layouts/:id', { preHandler: requirePrivateRead }, async (req, reply) => {
        const result = await queryBus.dispatch(new GetPageLayoutByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { pageType: string; pageRef: string } }>(
        '/page-layouts',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['pageType', 'pageRef'],
                    properties: {
                        pageType: { type: 'string', enum: Object.values(PageType) },
                        pageRef: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { pageType, pageRef } = req.body;
            const id = crypto.randomUUID();
            await commandBus.dispatch(new CreatePageLayoutCommand(id, pageType, pageRef));
            return reply.status(201).send({ id });
        },
    );

    app.post<{
        Params: { id: string };
        Body: {
            type: string;
            contentRef?: string | null;
            content?: Record<string, unknown>;
            x: number;
            y: number;
            w: number;
            h: number;
        };
    }>(
        '/page-layouts/:id/sections',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['type', 'x', 'y', 'w', 'h'],
                    properties: {
                        type: { type: 'string', enum: Object.values(SectionType) },
                        contentRef: { type: ['string', 'null'] },
                        content: { type: 'object', additionalProperties: true },
                        x: { type: 'number' },
                        y: { type: 'number' },
                        w: { type: 'number' },
                        h: { type: 'number' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { type, contentRef, content, x, y, w, h } = req.body;
            await commandBus.dispatch(
                new AddSectionCommand(
                    req.params.id,
                    crypto.randomUUID(),
                    type,
                    contentRef ?? null,
                    content ?? {},
                    x,
                    y,
                    w,
                    h,
                ),
            );
            return reply.status(204).send();
        },
    );

    app.patch<{
        Params: { id: string; sectionId: string };
        Body: { content?: Record<string, unknown>; contentRef?: string | null };
    }>(
        '/page-layouts/:id/sections/:sectionId/content',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    properties: {
                        content: { type: 'object', additionalProperties: true },
                        contentRef: { type: ['string', 'null'] },
                    },
                },
            },
        },
        async (req, reply) => {
            const { content, contentRef } = req.body;
            await commandBus.dispatch(
                new UpdateSectionContentCommand(req.params.id, req.params.sectionId, content ?? {}, contentRef ?? null),
            );
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; sectionId: string } }>(
        '/page-layouts/:id/sections/:sectionId',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new RemoveSectionCommand(req.params.id, req.params.sectionId));
            return reply.status(204).send();
        },
    );

    app.patch<{
        Params: { id: string; sectionId: string };
        Body: { x: number; y: number; w: number; h: number };
    }>(
        '/page-layouts/:id/sections/:sectionId/move',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['x', 'y', 'w', 'h'],
                    properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                        w: { type: 'number' },
                        h: { type: 'number' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { x, y, w, h } = req.body;
            await commandBus.dispatch(new MoveSectionCommand(req.params.id, req.params.sectionId, x, y, w, h));
            return reply.status(204).send();
        },
    );
};
