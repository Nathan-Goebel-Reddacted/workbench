import { describe, expect, it, vi } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { hasPrivateRead, requirePrivateRead, requireRole } from './roleGuard.js';
import { UserRole } from '@shared/domain/valueObject/userRole';

// Ce garde porte toute la fermeture des routes privées : une régression ici rouvre en silence
// ce que la section B du backlog a fermé.

function requestWith(roles?: string[]): FastifyRequest {
    return { user: roles === undefined ? undefined : { roles } } as unknown as FastifyRequest;
}

function replySpy() {
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    return { reply: { status } as unknown as FastifyReply, status, send };
}

describe('requireRole', () => {
    it('laisse passer un rôle attendu', async () => {
        const { reply, status } = replySpy();

        await requireRole(UserRole.EDIT)(requestWith(['edit']), reply);

        expect(status).not.toHaveBeenCalled();
    });

    it('laisse passer dès qu’un seul des rôles attendus est porté', async () => {
        const { reply, status } = replySpy();

        await requireRole(UserRole.VIEW, UserRole.EDIT)(requestWith(['edit']), reply);

        expect(status).not.toHaveBeenCalled();
    });

    it('refuse un rôle absent', async () => {
        const { reply, status, send } = replySpy();

        await requireRole(UserRole.EDIT)(requestWith(['view']), reply);

        expect(status).toHaveBeenCalledWith(403);
        expect(send).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('refuse un compte sans aucun rôle', async () => {
        const { reply, status } = replySpy();

        await requireRole(UserRole.EDIT)(requestWith([]), reply);

        expect(status).toHaveBeenCalledWith(403);
    });

    it('refuse un visiteur anonyme', async () => {
        const { reply, status } = replySpy();

        await requireRole(UserRole.EDIT)(requestWith(undefined), reply);

        expect(status).toHaveBeenCalledWith(403);
    });
});

describe('requirePrivateRead', () => {
    it('accepte view comme edit', async () => {
        for (const roles of [['view'], ['edit'], ['view', 'edit']]) {
            const { reply, status } = replySpy();

            await requirePrivateRead(requestWith(roles), reply);

            expect(status, roles.join('+')).not.toHaveBeenCalled();
        }
    });

    it('refuse l’anonyme', async () => {
        const { reply, status } = replySpy();

        await requirePrivateRead(requestWith(undefined), reply);

        expect(status).toHaveBeenCalledWith(403);
    });
});

describe('hasPrivateRead', () => {
    // Utilisé par les routes qui restent publiques mais dont le contenu dépend de l'appelant :
    // le filtre `visible` de l'item 13 s'appuie dessus.
    it('distingue une session privée d’un visiteur', () => {
        expect(hasPrivateRead(requestWith(['view']))).toBe(true);
        expect(hasPrivateRead(requestWith(['edit']))).toBe(true);
        expect(hasPrivateRead(requestWith([]))).toBe(false);
        expect(hasPrivateRead(requestWith(undefined))).toBe(false);
    });

    it('ignore un rôle inconnu', () => {
        expect(hasPrivateRead(requestWith(['admin']))).toBe(false);
    });
});
