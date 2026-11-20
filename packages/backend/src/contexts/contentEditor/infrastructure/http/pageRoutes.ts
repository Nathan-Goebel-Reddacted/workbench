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
import { DERIVED_SCREENS, MAX_SCREEN_HEIGHTS, SCREEN_SIZES, SCREENS } from '../../domain/valueObject/screenSize';
import { HideElementCommand } from '../../application/command/hideElement/hideElementCommand';
import { RegenerateLayoutCommand } from '../../application/command/regenerateLayout/regenerateLayoutCommand';
import { COMPONENT_KINDS } from '../../domain/component/componentRegistry';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

type PageRefInput = { pageType: string; pageRef: string };
type TransformInput = { screen: string; x: number; y: number; w: number; h: number };

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
    oneOf: SCREENS.map(screen => ({
        type: 'object',
        required: ['screen', 'x', 'y', 'w', 'h'],
        additionalProperties: false,
        properties: {
            screen: { const: screen },
            x: { type: 'integer', minimum: 0, maximum: SCREEN_SIZES[screen] - 1 },
            y: { type: 'integer', minimum: 0, maximum: MAX_SCREEN_HEIGHTS[screen] - 1 },
            w: { type: 'integer', minimum: 1, maximum: SCREEN_SIZES[screen] },
            h: { type: 'integer', minimum: 1, maximum: MAX_SCREEN_HEIGHTS[screen] },
        },
    })),
};

const hiddenBody = {
    type: 'object',
    required: ['screen', 'hidden'],
    additionalProperties: false,
    properties: { screen: { type: 'string', enum: SCREENS }, hidden: { type: 'boolean' } },
} as const;

const regenerateBody = {
    type: 'object',
    required: ['screen'],
    additionalProperties: false,
    properties: { screen: { type: 'string', enum: DERIVED_SCREENS } },
} as const;

function sendPage(reply: FastifyReply, page: PageDto | null) {
    return page ? reply.send(page) : reply.status(404).send({ error: 'Page not found' });
}

export const pageRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    const readByRef = (input: PageRefInput, includeHidden: boolean, forEditor: boolean) =>
        queryBus.dispatch<GetPageByRefQuery, PageDto | null>(
            new GetPageByRefQuery(input.pageType, input.pageRef, includeHidden, forEditor),
        );

    app.get<{ Querystring: PageRefInput }>(
        '/pages/by-ref',
        { config: { anonymousRead: true }, schema: { querystring: pageRefSchema } },
        async (req, reply) => reply.send(await readByRef(req.query, hasPrivateRead(req), false)),
    );

    app.get<{ Querystring: PageRefInput }>(
        '/pages/private/by-ref',
        { preHandler: requirePrivateRead, schema: { querystring: pageRefSchema } },
        async (req, reply) => sendPage(reply, await readByRef(req.query, true, true)),
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
            return sendPage(reply, await readByRef(req.body, true, true));
        },
    );

    app.post<{ Params: { id: string }; Body: { screen: string; visibleTop?: number } }>(
        '/pages/:id/elements',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                params: pageParams,
                body: {
                    type: 'object',
                    required: ['screen'],
                    additionalProperties: false,
                    properties: {
                        screen: { type: 'string', enum: SCREENS },
                        visibleTop: { type: 'integer', minimum: 0, maximum: MAX_SCREEN_HEIGHTS.mobile },
                    },
                },
            },
        },
        async (req, reply) => {
            const elementId = crypto.randomUUID();
            await commandBus.dispatch(
                new AddElementCommand(req.params.id, elementId, req.body.screen, req.body.visibleTop ?? null),
            );
            return reply.status(201).send({ id: elementId });
        },
    );

    app.patch<{ Params: { id: string; elementId: string }; Body: TransformInput }>(
        '/pages/:id/elements/:elementId/transform',
        { preHandler: requireRole(UserRole.EDIT), schema: { params: elementParams, body: transformBody } },
        async (req, reply) => {
            const { screen, x, y, w, h } = req.body;
            await commandBus.dispatch(new MoveElementCommand(req.params.id, req.params.elementId, screen, x, y, w, h));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string; elementId: string }; Body: { screen: string; hidden: boolean } }>(
        '/pages/:id/elements/:elementId/hidden',
        { preHandler: requireRole(UserRole.EDIT), schema: { params: elementParams, body: hiddenBody } },
        async (req, reply) => {
            const { screen, hidden } = req.body;
            await commandBus.dispatch(new HideElementCommand(req.params.id, req.params.elementId, screen, hidden));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: { screen: string } }>(
        '/pages/:id/layout/regenerate',
        { preHandler: requireRole(UserRole.EDIT), schema: { params: pageParams, body: regenerateBody } },
        async (req, reply) => {
            await commandBus.dispatch(new RegenerateLayoutCommand(req.params.id, req.body.screen));
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
