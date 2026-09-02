import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { requireRole } from '@shared/infrastructure/http/roleGuard';
import { CreateAgentToolCommand } from '@contexts/ai-assistant/application/command/createAgentTool/createAgentToolCommand';
import { UpdateAgentToolNameCommand } from '@contexts/ai-assistant/application/command/updateAgentToolName/updateAgentToolNameCommand';
import { UpdateAgentToolPermissionCommand } from '@contexts/ai-assistant/application/command/updateAgentToolPermission/updateAgentToolPermissionCommand';
import { AddAgentToolScopeCommand } from '@contexts/ai-assistant/application/command/addAgentToolScope/addAgentToolScopeCommand';
import { RemoveAgentToolScopeCommand } from '@contexts/ai-assistant/application/command/removeAgentToolScope/removeAgentToolScopeCommand';
import { RotateAgentToolTokenCommand } from '@contexts/ai-assistant/application/command/rotateAgentToolToken/rotateAgentToolTokenCommand';
import { RevokeAgentToolCommand } from '@contexts/ai-assistant/application/command/revokeAgentTool/revokeAgentToolCommand';
import { RestoreAgentToolCommand } from '@contexts/ai-assistant/application/command/restoreAgentTool/restoreAgentToolCommand';
import { GetAgentToolByIdQuery } from '@contexts/ai-assistant/application/query/getAgentToolById/getAgentToolByIdQuery';
import { GetAgentToolsByUserIdQuery } from '@contexts/ai-assistant/application/query/getAgentToolsByUserId/getAgentToolsByUserIdQuery';
import { GetAllAgentToolsQuery } from '@contexts/ai-assistant/application/query/getAllAgentTools/getAllAgentToolsQuery';
import { issueAgentToken } from '@contexts/ai-assistant/application/auth/agentToken';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

/**
 * Every route here grants or alters an agent's access to the API, so all of them are
 * administration: the session guard alone would let any signed-in account mint an agent.
 */
export const agentToolRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.addHook('preHandler', requireRole('edit'));

    app.get('/agent-tools', async (_req, reply) => {
        const result = await queryBus.dispatch(new GetAllAgentToolsQuery());
        return reply.send(result);
    });

    app.get<{ Params: { userId: string } }>('/agent-tools/by-user/:userId', async (req, reply) => {
        const result = await queryBus.dispatch(new GetAgentToolsByUserIdQuery(req.params.userId));
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/agent-tools/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetAgentToolByIdQuery(req.params.id));
        return reply.send(result);
    });

    app.post<{ Body: { userId: string; name: string; permission: string; scopes: string[] } }>(
        '/agent-tools',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['userId', 'name', 'permission', 'scopes'],
                    properties: {
                        userId: { type: 'string' },
                        name: { type: 'string' },
                        permission: { type: 'string' },
                        scopes: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
        },
        async (req, reply) => {
            const { userId, name, permission, scopes } = req.body;
            const id = crypto.randomUUID();
            // The secret is generated server-side and only ever leaves the API here: it is stored hashed.
            const { secret, token } = issueAgentToken(id);
            await commandBus.dispatch(new CreateAgentToolCommand(id, userId, name, permission, scopes, secret));
            return reply.status(201).send({ id, token });
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

    app.post<{ Params: { id: string } }>('/agent-tools/:id/revoke', async (req, reply) => {
        await commandBus.dispatch(new RevokeAgentToolCommand(req.params.id));
        return reply.status(204).send();
    });

    app.post<{ Params: { id: string } }>('/agent-tools/:id/restore', async (req, reply) => {
        await commandBus.dispatch(new RestoreAgentToolCommand(req.params.id));
        return reply.status(204).send();
    });

    app.post<{ Params: { id: string } }>('/agent-tools/:id/rotate-token', async (req, reply) => {
        // Same as creation: the new secret is generated here and returned once, never stored in clear.
        const { secret, token } = issueAgentToken(req.params.id);
        await commandBus.dispatch(new RotateAgentToolTokenCommand(req.params.id, secret));
        return reply.status(200).send({ id: req.params.id, token });
    });
};
