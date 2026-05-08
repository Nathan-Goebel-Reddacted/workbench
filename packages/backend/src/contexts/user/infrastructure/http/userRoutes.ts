import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { requireRole } from '@shared/infrastructure/http/roleGuard';
import { GetUserByIdQuery } from '@contexts/user/application/query/getUserById/getUserByIdQuery';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery';
import { GetAllUsersQuery } from '@contexts/user/application/query/getAllUsers/getAllUsersQuery';
import { DeleteUserCommand } from '@contexts/user/application/command/deleteUser/deleteUserCommand';
import { UpdateUserRolesCommand } from '@contexts/user/application/command/updateUserRoles/updateUserRolesCommand';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const userRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Querystring: { email: string } }>('/users/by-email', async (req, reply) => {
        const result = await queryBus.dispatch(new GetUserByEmailQuery(req.query.email));
        return reply.send(result);
    });

    app.get<{ Params: { id: string } }>('/users/:id', async (req, reply) => {
        const result = await queryBus.dispatch(new GetUserByIdQuery(req.params.id));
        return reply.send(result);
    });

    // ── Admin routes (non protégées — brancher requireRole('admin') quand besoin) ──

    app.get('/users', async (_req, reply) => {
        const result = await queryBus.dispatch(new GetAllUsersQuery());
        return reply.send(result);
    });

    app.delete<{ Params: { id: string } }>('/users/:id', { preHandler: requireRole('edit') }, async (req, reply) => {
        await commandBus.dispatch(new DeleteUserCommand(req.params.id));
        return reply.status(204).send();
    });

    app.patch<{ Params: { id: string }; Body: { roles: string[] } }>(
        '/users/:id/roles',
        {
            preHandler: requireRole('edit'),
            schema: {
                body: {
                    type: 'object',
                    required: ['roles'],
                    properties: { roles: { type: 'array', items: { type: 'string' } } },
                },
            },
        },
        async (req, reply) => {
            try {
                await commandBus.dispatch(new UpdateUserRolesCommand(req.params.id, req.body.roles));
                return reply.status(204).send();
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : '';
                if (msg.startsWith('User not found')) return reply.status(404).send({ error: msg });
                if (msg.startsWith('Invalid role')) return reply.status(400).send({ error: msg });
                throw err;
            }
        },
    );
};
