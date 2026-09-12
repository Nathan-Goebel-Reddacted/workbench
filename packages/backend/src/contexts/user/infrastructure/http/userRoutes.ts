import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { requireRole, requirePrivateRead } from '@shared/infrastructure/http/roleGuard';
import { GetUserByIdQuery } from '@contexts/user/application/query/getUserById/getUserByIdQuery';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery';
import { GetAllUsersQuery } from '@contexts/user/application/query/getAllUsers/getAllUsersQuery';
import { DeleteUserCommand } from '@contexts/user/application/command/deleteUser/deleteUserCommand';
import { UpdateUserRolesCommand } from '@contexts/user/application/command/updateUserRoles/updateUserRolesCommand';
import { UserRole } from '@shared/domain/valueObject/userRole';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

export const userRoutes: FastifyPluginAsync<Opts> = async (app, { commandBus, queryBus }) => {
    app.get<{ Querystring: { email: string } }>(
        '/users/by-email',
        { preHandler: requirePrivateRead },
        async (req, reply) => {
            const result = await queryBus.dispatch(new GetUserByEmailQuery(req.query.email));
            return reply.send(result);
        },
    );

    app.get<{ Params: { id: string } }>('/users/:id', { preHandler: requirePrivateRead }, async (req, reply) => {
        const result = await queryBus.dispatch(new GetUserByIdQuery(req.params.id));
        return reply.send(result);
    });

    // ── Admin routes ──

    app.get('/users', { preHandler: requirePrivateRead }, async (_req, reply) => {
        const result = await queryBus.dispatch(new GetAllUsersQuery());
        return reply.send(result);
    });

    app.delete<{ Params: { id: string } }>(
        '/users/:id',
        { preHandler: requireRole(UserRole.EDIT) },
        async (req, reply) => {
            await commandBus.dispatch(new DeleteUserCommand(req.params.id));
            return reply.status(204).send();
        },
    );

    app.patch<{ Params: { id: string }; Body: { roles: string[] } }>(
        '/users/:id/roles',
        {
            preHandler: requireRole(UserRole.EDIT),
            schema: {
                body: {
                    type: 'object',
                    required: ['roles'],
                    properties: { roles: { type: 'array', items: { type: 'string' } } },
                },
            },
        },
        async (req, reply) => {
            await commandBus.dispatch(new UpdateUserRolesCommand(req.params.id, req.body.roles));
            return reply.status(204).send();
        },
    );
};
