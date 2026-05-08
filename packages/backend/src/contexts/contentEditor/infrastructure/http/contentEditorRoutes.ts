import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreatePageLayoutCommand } from '@contexts/contentEditor/application/command/createPageLayout/createPageLayoutCommand';
import { AddSectionCommand } from '@contexts/contentEditor/application/command/addSection/addSectionCommand';
import { RemoveSectionCommand } from '@contexts/contentEditor/application/command/removeSection/removeSectionCommand';
import { MoveSectionCommand } from '@contexts/contentEditor/application/command/moveSection/moveSectionCommand';
import { GetPageLayoutByIdQuery } from '@contexts/contentEditor/application/query/getPageLayoutById/getPageLayoutByIdQuery';
import { GetPageLayoutByRefQuery } from '@contexts/contentEditor/application/query/getPageLayoutByRef/getPageLayoutByRefQuery';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const contentEditorRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Querystring: { pageType: string; pageRef: string } }>(
        '/page-layouts/by-ref',
        async (req, reply) => {
            const result = await queryBus.dispatch(new GetPageLayoutByRefQuery(req.query.pageType, req.query.pageRef));
            return reply.send(result);
        },
    );

    app.get<{ Params: { id: string } }>('/page-layouts/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetPageLayoutByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { pageType: string; pageRef: string } }>(
        '/page-layouts',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['pageType', 'pageRef'],
                    properties: {
                        pageType: { type: 'string' },
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
        Body: { type: string; contentRef: string; column: number; order: number };
    }>(
        '/page-layouts/:id/sections',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['type', 'contentRef', 'column', 'order'],
                    properties: {
                        type: { type: 'string' },
                        contentRef: { type: 'string' },
                        column: { type: 'number' },
                        order: { type: 'number' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { type, contentRef, column, order } = req.body;
            await commandBus.dispatch(
                new AddSectionCommand(req.params.id, crypto.randomUUID(), type, contentRef, column, order),
            );
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; sectionId: string } }>(
        '/page-layouts/:id/sections/:sectionId',
        async (req, reply) => {
            await commandBus.dispatch(new RemoveSectionCommand(req.params.id, req.params.sectionId));
            return reply.status(204).send();
        },
    );

    app.patch<{
        Params: { id: string; sectionId: string };
        Body: { column: number; order: number };
    }>(
        '/page-layouts/:id/sections/:sectionId/move',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['column', 'order'],
                    properties: {
                        column: { type: 'number' },
                        order: { type: 'number' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { column, order } = req.body;
            await commandBus.dispatch(new MoveSectionCommand(req.params.id, req.params.sectionId, column, order));
            return reply.status(204).send();
        },
    );
};
