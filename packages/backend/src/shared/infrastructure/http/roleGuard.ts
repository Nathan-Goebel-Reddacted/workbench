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

// La partie privée se lit avec `view`, le rôle de base ; `edit` l'inclut. Les routes qui
// portent ce garde ne sont consommées que par frontend-private — le site public a son
// propre jeu de routes ouvertes.
export const requirePrivateRead = requireRole('view', 'edit');

// Pour les routes qui restent publiques mais dont le contenu dépend de l'appelant : le
// visiteur anonyme ne voit que ce qui est `visible`, la session privée voit tout.
export function hasPrivateRead(req: FastifyRequest): boolean {
    const userRoles: string[] = req.user?.roles ?? [];
    return userRoles.includes('view') || userRoles.includes('edit');
}
