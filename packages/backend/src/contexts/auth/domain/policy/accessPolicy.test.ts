import { describe, expect, it } from 'vitest';
import { AccessPolicy } from './accessPolicy.js';
import { AuthEmail } from '../valueObject/email.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';

// La règle la plus sensible de l'application : qui entre, et avec quel pouvoir. Elle vivait
// au milieu d'un gestionnaire de route, entre deux appels réseau, et n'était vérifiable
// qu'en se connectant vraiment.

const admin = new AuthEmail('admin@example.com');
const visitor = new AuthEmail('visiteur@example.com');

describe('AccessPolicy', () => {
    it('accorde edit à l’adresse d’amorçage — sinon la base vierge reste verrouillée à jamais', () => {
        const policy = new AccessPolicy(admin);

        expect(policy.rolesForNewAccount(admin)).toEqual([UserRole.EDIT]);
    });

    it('accorde view à tout autre compte — un compte sans rôle ne pourrait rien lire', () => {
        const policy = new AccessPolicy(admin);

        expect(policy.rolesForNewAccount(visitor)).toEqual([UserRole.VIEW]);
    });

    it('reconnaît l’adresse d’amorçage quelle que soit sa casse', () => {
        const policy = new AccessPolicy(new AuthEmail('Admin@Example.com'));

        expect(policy.isBootstrapAdmin(new AuthEmail('admin@EXAMPLE.com'))).toBe(true);
    });

    it('n’accorde edit à personne quand aucune adresse d’amorçage n’est déclarée', () => {
        const policy = new AccessPolicy(null);

        expect(policy.isBootstrapAdmin(admin)).toBe(false);
        expect(policy.rolesForNewAccount(admin)).toEqual([UserRole.VIEW]);
    });
});
