import { FastifyPluginAsync } from 'fastify';
import { CommandBus } from '@shared/application/command/commandBus';
import { QueryBus } from '@shared/application/query/queryBus';
import { requireRole, requirePrivateRead } from '@shared/infrastructure/http/roleGuard';
import { GetUserByIdQuery } from '@contexts/user/application/query/getUserById/getUserByIdQuery';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery';
import { GetAllUsersQuery } from '@contexts/user/application/query/getAllUsers/getAllUsersQuery';
import { DeleteUserCommand } from '@contexts/user/application/command/deleteUser/deleteUserCommand';
import { GrantUserRoleCommand } from '@contexts/user/application/command/grantUserRole/grantUserRoleCommand';
import { RevokeUserRoleCommand } from '@contexts/user/application/command/revokeUserRole/revokeUserRoleCommand';
import { UserRole } from '@shared/domain/valueObject/userRole';

type Opts = { commandBus: CommandBus; queryBus: QueryBus };

const roleParamsSchema = {
    params: {
        type: 'object',
        required: ['id', 'role'],
        properties: { id: { type: 'string' }, role: { type: 'string', enum: Object.values(UserRole) } },
    },
};

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
            await commandBus.dispatch(new DeleteUserCommand(req.params.id, req.user.sub));
            return reply.status(204).send();
        },
    );

    app.post<{ Params: { id: string; role: string } }>(
        '/users/:id/roles/:role',
        { preHandler: requireRole(UserRole.EDIT), schema: roleParamsSchema },
        async (req, reply) => {
            await commandBus.dispatch(new GrantUserRoleCommand(req.params.id, req.params.role));
            return reply.status(204).send();
        },
    );

    app.delete<{ Params: { id: string; role: string } }>(
        '/users/:id/roles/:role',
        { preHandler: requireRole(UserRole.EDIT), schema: roleParamsSchema },
        async (req, reply) => {
            await commandBus.dispatch(new RevokeUserRoleCommand(req.params.id, req.params.role));
            return reply.status(204).send();
        },
    );
};
