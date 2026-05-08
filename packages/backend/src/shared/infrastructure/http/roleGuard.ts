import { FastifyReply, FastifyRequest } from 'fastify';

export function requireRole(...roles: string[]) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
        const userRoles: string[] = req.user?.roles ?? [];
        const hasRole = roles.some(r => userRoles.includes(r));
        if (!hasRole) {
            return reply.status(403).send({ error: 'Forbidden' });
        }
    };
}
