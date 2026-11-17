import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { hasPrivateRead, requirePrivateRead, requireRole } from '@shared/infrastructure/http/roleGuard';
import { UserRole } from '@shared/domain/valueObject/userRole';
import { EnsurePageCommand } from '../../application/command/ensurePage/ensurePageCommand';
import { AddElementCommand } from '../../application/command/addElement/addElementCommand';
import { MoveElementCommand } from '../../application/command/moveElement/moveElementCommand';
import { ReorderElementCommand } from '../../application/command/reorderElement/reorderElementCommand';
import { DuplicateElementCommand } from '../../application/command/duplicateElement/duplicateElementCommand';
import { SetComponentCommand } from '../../application/command/setComponent/setComponentCommand';
import { RemoveComponentCommand } from '../../application/command/removeComponent/removeComponentCommand';
import { DeleteElementCommand } from '../../application/command/deleteElement/deleteElementCommand';
import { GetPageByIdQuery } from '../../application/query/getPageById/getPageByIdQuery';
import { GetPageByRefQuery } from '../../application/query/getPageByRef/getPageByRefQuery';
import { PageDto } from '../../application/query/pageDto';
import { PageType } from '../../domain/valueObject/pageType';
import { ReorderDirection } from '../../domain/pageAggregate';
import { MAX_PAGE_HEIGHT, REFERENCE_WIDTH } from '../../domain/valueObject/transform';
import { COMPONENT_KINDS } from '../../domain/component/componentRegistry';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

type PageRefInput = { pageType: string; pageRef: string };
type TransformInput = { x: number; y: number; w: number; h: number };

const uuid = { type: 'string', format: 'uuid' } as const;

const pageRefSchema = {
    type: 'object',
    required: ['pageType', 'pageRef'],
    additionalProperties: false,
    properties: {
        pageType: { type: 'string', enum: Object.values(PageType) },
        pageRef: uuid,
    },
} as const;

const pageParams = {
    type: 'object',
    required: ['id'],
    properties: { id: uuid },
} as const;

const elementParams = {
    type: 'object',
    required: ['id', 'elementId'],
    properties: { id: uuid, elementId: uuid },
} as const;

const componentParams = {
    type: 'object',
    required: ['id', 'elementId', 'kind'],
    properties: { id: uuid, elementId: uuid, kind: { type: 'string', enum: COMPONENT_KINDS } },
} as const;

const transformBody = {
    type: 'object',
    required: ['x', 'y', 'w', 'h'],
    additionalProperties: false,
    properties: {
        x: { type: 'integer', minimum: 0, maximum: REFERENCE_WIDTH - 1 },
        y: { type: 'integer', minimum: 0, maximum: MAX_PAGE_HEIGHT - 1 },
        w: { type: 'integer', minimum: 1, maximum: REFERENCE_WIDTH },
        h: { type: 'integer', minimum: 1, maximum: MAX_PAGE_HEIGHT },
    },
} as const;

function sendPage(reply: FastifyReply, page: PageDto | null) {
    return page ? reply.send(page) : reply.status(404).send({ error: 'Page not found' });
}

export const pageRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    const readByRef = (input: PageRefInput, includeHidden: boolean) =>
        queryBus.dispatch<GetPageByRefQuery, PageDto | null>(
            new GetPageByRefQuery(input.pageType, input.pageRef, includeHidden),
        );

    app.get<{ Querystring: PageRefInput }>(
        '/pages/by-ref',
        { config: { anonymousRead: true }, schema: { querystring: pageRefSchema } },
        async (req, reply) => reply.send(await readByRef(req.query, hasPrivateRead(req))),
    );

    app.get<{ Querystring: PageRefInput }>(
        '/pages/private/by-ref',
        { preHandler: requirePrivateRead, schema: { querystring: pageRefSchema } },
        async (req, reply) => sendPage(reply, await readByRef(req.query, true)),
    );

    app.get<{ Params: { id: string } }>(
        '/pages/:id',
        { preHandler: requirePrivateRead, schema: { params: pageParams } },
        async (req, reply) =>
            sendPage(
                reply,
                await queryBus.dispatch<GetPageByIdQuery, PageDto | null>(new GetPageByIdQuery(req.params.id)),
            ),
    );

    app.put<{ Body: PageRefInput }>(
        '/pages/by-ref',
        { preHandler: requireRole(UserRole.EDIT), schema: { body: pageRefSchema } },
        async (req, reply) => {
            await commandBus.dispatch(new EnsurePageCommand(crypto.randomUUID(), req.body.pageType, req.body.pageRef));
            return sendPage(reply, await readByRef(req.body, true));
        },
    );

    app.post<{ Params: { id: string }; Body: { visibleTop?: number } }>(
        '/pages/:id/elements',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                params: pageParams,
                body: {
                    type: 'object',
                    additionalProperties: false,
                    properties: { visibleTop: { type: 'integer', minimum: 0, maximum: MAX_PAGE_HEIGHT } },
                },
            },
        },
        async (req, reply) => {
            const elementId = crypto.randomUUID();
            await commandBus.dispatch(new AddElementCommand(req.params.id, elementId, req.body?.visibleTop ?? null));
            return reply.status(201).send({ id: elementId });
        },
    );

    app.patch<{ Params: { id: string; elementId: string }; Body: TransformInput }>(
        '/pages/:id/elements/:elementId/transform',
        { preHandler: requireRole(UserRole.EDIT), schema: { params: elementParams, body: transformBody } },
        async (req, reply) => {
            const { x, y, w, h } = req.body;
            await commandBus.dispatch(new MoveElementCommand(req.params.id, req.params.elementId, x, y, w, h));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string; elementId: string }; Body: { direction: ReorderDirection } }>(
        '/pages/:id/elements/:elementId/reorder',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                params: elementParams,
                body: {
                    type: 'object',
                    required: ['direction'],
                    additionalProperties: false,
                    properties: { direction: { type: 'string', enum: ['forward', 'backward'] } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(
                new ReorderElementCommand(req.params.id, req.params.elementId, req.body.direction),
            );
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string; elementId: string } }>(
        '/pages/:id/elements/:elementId/duplicate',
        { preHandler: requireRole(UserRole.EDIT), schema: { params: elementParams } },
        async (req, reply) => {
            const elementId = crypto.randomUUID();
            await commandBus.dispatch(new DuplicateElementCommand(req.params.id, req.params.elementId, elementId));
            return reply.status(201).send({ id: elementId });
        },
    );

    app.put<{ Params: { id: string; elementId: string; kind: string }; Body: Record<string, unknown> }>(
        '/pages/:id/elements/:elementId/components/:kind',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: { params: componentParams, body: { type: 'object', additionalProperties: true } },
        },
        async (req, reply) => {
            const { id, elementId, kind } = req.params;
            await commandBus.dispatch(new SetComponentCommand(id, elementId, kind, req.body));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; elementId: string; kind: string } }>(
        '/pages/:id/elements/:elementId/components/:kind',
        { preHandler: requireRole(UserRole.EDIT), schema: { params: componentParams } },
        async (req, reply) => {
            const { id, elementId, kind } = req.params;
            await commandBus.dispatch(new RemoveComponentCommand(id, elementId, kind));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; elementId: string } }>(
        '/pages/:id/elements/:elementId',
        { preHandler: requireRole(UserRole.EDIT), schema: { params: elementParams } },
        async (req, reply) => {
            await commandBus.dispatch(new DeleteElementCommand(req.params.id, req.params.elementId));
            return reply.status(204).send();
        },
    );
};
