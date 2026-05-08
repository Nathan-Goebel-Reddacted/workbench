import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { CreateAgentToolCommand } from '@contexts/ai-assistant/application/command/createAgentTool/createAgentToolCommand';
import { UpdateAgentToolNameCommand } from '@contexts/ai-assistant/application/command/updateAgentToolName/updateAgentToolNameCommand';
import { UpdateAgentToolPermissionCommand } from '@contexts/ai-assistant/application/command/updateAgentToolPermission/updateAgentToolPermissionCommand';
import { AddAgentToolScopeCommand } from '@contexts/ai-assistant/application/command/addAgentToolScope/addAgentToolScopeCommand';
import { RemoveAgentToolScopeCommand } from '@contexts/ai-assistant/application/command/removeAgentToolScope/removeAgentToolScopeCommand';
import { RotateAgentToolTokenCommand } from '@contexts/ai-assistant/application/command/rotateAgentToolToken/rotateAgentToolTokenCommand';
import { GetAgentToolByIdQuery } from '@contexts/ai-assistant/application/query/getAgentToolById/getAgentToolByIdQuery';
import { GetAgentToolsByUserIdQuery } from '@contexts/ai-assistant/application/query/getAgentToolsByUserId/getAgentToolsByUserIdQuery';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const agentToolRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Params: { userId: string } }>('/agent-tools/by-user/:userId', async (req, reply) => {
        const result = await queryBus.dispatch(new GetAgentToolsByUserIdQuery(req.params.userId));
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/agent-tools/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetAgentToolByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { userId: string; name: string; permission: string; scopes: string[]; token: string } }>(
        '/agent-tools',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['userId', 'name', 'permission', 'scopes', 'token'],
                    properties: {
                        userId: { type: 'string' },
                        name: { type: 'string' },
                        permission: { type: 'string' },
                        scopes: { type: 'array', items: { type: 'string' } },
                        token: { type: 'string' },
                    },
                },
            },
        },
        async (req, reply) => {
            const { userId, name, permission, scopes, token } = req.body;
            const id = crypto.randomUUID();
            await commandBus.dispatch(new CreateAgentToolCommand(id, userId, name, permission, scopes, token));
            return reply.status(201).send({ id });
        },
    );

    app.patch<{ Params: { id: string }; Body: { name: string } }>(
        '/agent-tools/:id/name',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['name'],
                    properties: { name: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new UpdateAgentToolNameCommand(req.params.id, req.body.name));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string }; Body: { permission: string } }>(
        '/agent-tools/:id/permission',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['permission'],
                    properties: { permission: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new UpdateAgentToolPermissionCommand(req.params.id, req.body.permission));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: { scope: string } }>(
        '/agent-tools/:id/scopes',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['scope'],
                    properties: { scope: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new AddAgentToolScopeCommand(req.params.id, req.body.scope));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string }; Body: { scope: string } }>(
        '/agent-tools/:id/scopes',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['scope'],
                    properties: { scope: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new RemoveAgentToolScopeCommand(req.params.id, req.body.scope));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string }; Body: { token: string } }>(
        '/agent-tools/:id/rotate-token',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['token'],
                    properties: { token: { type: 'string' } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new RotateAgentToolTokenCommand(req.params.id, req.body.token));
            return reply.status(204).send();
        },
    );
};
