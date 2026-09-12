import { describe, expect, it } from 'vitest';
import { AccessRequest } from './accessRequestAggregate.js';
import { AccessRequestStatus } from './valueObject/accessRequestStatus.js';
import { AuthEmail, InvalidAuthEmailException } from './valueObject/email.js';

const email = new AuthEmail('visiteur@example.com');

describe('AuthEmail', () => {
    it('normalise en minuscules — c’est la normalisation qui fait l’identité', () => {
        expect(new AuthEmail('  Visiteur@Example.COM ').getValue()).toBe('visiteur@example.com');
    });

    it('refuse ce qui n’est pas une adresse', () => {
        expect(() => new AuthEmail('pas-une-adresse')).toThrow(InvalidAuthEmailException);
        expect(() => new AuthEmail('')).toThrow(InvalidAuthEmailException);
    });

    it('compare sur la forme normalisée', () => {
        expect(new AuthEmail('A@b.c').equals(new AuthEmail('a@B.C'))).toBe(true);
    });
});

describe('AccessRequest', () => {
    it('naît en attente d’une décision humaine', () => {
        const request = AccessRequest.open(email, 'Jean Dupont');

        expect(request.getStatus()).toBe(AccessRequestStatus.PENDING);
        expect(request.getDisplayName()).toBe('Jean Dupont');
    });

    it('retombe sur l’adresse quand le fournisseur ne donne pas de nom', () => {
        expect(AccessRequest.open(email, '   ').getDisplayName()).toBe('visiteur@example.com');
    });

    it('rafraîchit le nom à une nouvelle tentative, sans s’empiler', () => {
        const request = AccessRequest.open(email, 'Ancien Nom', new Date('2026-01-01'));

        request.renew('Nouveau Nom', new Date('2026-02-01'));

        expect(request.getDisplayName()).toBe('Nouveau Nom');
        expect(request.getStatus()).toBe(AccessRequestStatus.PENDING);
        expect(request.getUpdatedAt()).toEqual(new Date('2026-02-01'));
    });

    it('ne ressuscite jamais une demande rejetée quand la personne retente', () => {
        const request = AccessRequest.open(email, 'Jean');
        request.reject();

        request.renew('Jean qui insiste');

        expect(request.getStatus()).toBe(AccessRequestStatus.REJECTED);
        // Le nom ne bouge pas non plus : la demande est close, elle n'écoute plus.
        expect(request.getDisplayName()).toBe('Jean');
    });

    it('laisse l’administrateur revenir sur sa décision, dans les deux sens', () => {
        const request = AccessRequest.open(email, 'Jean');

        request.reject();
        expect(request.getStatus()).toBe(AccessRequestStatus.REJECTED);

        request.approve();
        expect(request.getStatus()).toBe(AccessRequestStatus.APPROVED);

        request.reject();
        expect(request.getStatus()).toBe(AccessRequestStatus.REJECTED);
    });

    it('ne touche pas à updatedAt quand la décision ne change rien', () => {
        const request = AccessRequest.open(email, 'Jean', new Date('2026-01-01'));
        request.approve(new Date('2026-02-01'));

        request.approve(new Date('2026-03-01'));

        expect(request.getUpdatedAt()).toEqual(new Date('2026-02-01'));
    });
});
