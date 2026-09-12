import { describe, expect, it } from 'vitest';
import { User } from './userAggregate.js';
import { UserId } from './valueObject/userId.js';
import { Name } from './valueObject/name.js';
import { Surname } from './valueObject/surname.js';
import { Email } from './valueObject/email.js';
import { InvalidEmailException } from './exception/invalidEmail.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';

// Un User porte deux choses que le reste du système croit sur parole : ses rôles, et la
// version de son jeton. La seconde est le seul moyen de rendre caduc un jeton déjà signé —
// sans elle, retirer un rôle ne prendrait effet qu'à l'expiration de la session.

function user(roles: UserRole[] = [UserRole.VIEW]): User {
    return new User(new UserId(), new Name('goebel'), new Surname('nathan'), new Email('a@b.test'), roles);
}

describe('User — identité', () => {
    it('normalise l’adresse : la casse et les espaces ne font pas deux comptes', () => {
        expect(new Email('  A@B.TEST ').getValue()).toBe('a@b.test');
    });

    it('refuse une adresse qui n’en est pas une', () => {
        expect(() => new Email('nathan.chez.moi')).toThrow(InvalidEmailException);
    });

    it('refuse un nom vide', () => {
        expect(() => new Name('   ')).toThrow();
    });

    it('compose le nom affiché à partir des deux parties', () => {
        expect(user().getDisplayName()).toBe('GOEBEL Nathan');
    });
});

describe('User — rôles', () => {
    it('dédoublonne les rôles reçus', () => {
        expect(user([UserRole.VIEW, UserRole.VIEW, UserRole.EDIT]).getRoles()).toEqual([UserRole.VIEW, UserRole.EDIT]);
    });

    it('rend une copie : modifier la liste rendue n’accorde rien', () => {
        const u = user([UserRole.VIEW]);

        u.getRoles().push(UserRole.EDIT);

        expect(u.getRoles()).toEqual([UserRole.VIEW]);
    });
});

describe('User — sessions', () => {
    it('naît à la version zéro', () => {
        expect(user().getTokenVersion()).toBe(0);
    });

    it('avance la version à chaque invalidation, pour périmer les jetons déjà signés', () => {
        const u = user();

        u.invalidateSessions();
        u.invalidateSessions();

        expect(u.getTokenVersion()).toBe(2);
    });
});
