import { describe, expect, it } from 'vitest';
import { ProvisionUserFromOAuthHandler } from './provisionUserFromOAuthHandler.js';
import { ProvisionUserFromOAuthCommand } from './provisionUserFromOAuthCommand.js';
import { AccessPolicy } from '../../../domain/policy/accessPolicy.js';
import { AuthEmail } from '../../../domain/valueObject/email.js';
import { AccessRequestStatus } from '../../../domain/valueObject/accessRequestStatus.js';
import { CommandBus } from '@shared/application/command/commandBus.js';
import { QueryBus } from '@shared/application/query/queryBus.js';
import { CreateUserCommand } from '@contexts/user/application/command/createUser/createUserCommand.js';
import { GetUserByEmailQuery } from '@contexts/user/application/query/getUserByEmail/getUserByEmailQuery.js';
import { RecordAccessRequestCommand } from '../recordAccessRequest/recordAccessRequestCommand.js';
import { UserAlreadyExistsException } from '@contexts/user/domain/exception/userAlreadyExists.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';
import type { IAllowedEmailRepository } from '../../../domain/repository/iAllowedEmailRepository.js';
import type { UserDto } from '@contexts/user/application/query/getUserById/userDto.js';

// Les quatre chemins par lesquels on entre — ou n'entre pas — dans la partie privée. Ils
// vivaient dans une fonction de 50 lignes au fond d'un fichier de routes, entre un fetch
// GitHub et la pose d'un cookie, et aucun n'était vérifiable autrement qu'en se connectant.

const ADMIN = 'admin@example.com';

function allowList(...emails: string[]): IAllowedEmailRepository {
    const set = new Set(emails);
    return {
        contains: async email => set.has(email.getValue()),
        findAll: async () => [...set].map(e => new AuthEmail(e)),
        add: async email => void set.add(email.getValue()),
        remove: async email => void set.delete(email.getValue()),
    };
}

type Harness = {
    handler: ProvisionUserFromOAuthHandler;
    created: CreateUserCommand[];
    recorded: RecordAccessRequestCommand[];
};

function harness(options: {
    allowed: string[];
    existingUser?: UserDto | null;
    /** Simule un callback concurrent qui a créé le compte entre-temps. */
    createFails?: boolean;
}): Harness {
    const created: CreateUserCommand[] = [];
    const recorded: RecordAccessRequestCommand[] = [];
    let stored: UserDto | null = options.existingUser ?? null;

    const commandBus = new CommandBus();
    commandBus.register(CreateUserCommand.commandName, {
        handle: async (command: CreateUserCommand) => {
            created.push(command);
            if (options.createFails) throw new UserAlreadyExistsException(command.email);
            stored = {
                id: command.id,
                name: command.name,
                surname: command.surname,
                email: command.email,
                roles: command.roles,
                tokenVersion: 0,
            };
        },
    });
    commandBus.register(RecordAccessRequestCommand.commandName, {
        handle: async (command: RecordAccessRequestCommand) => {
            recorded.push(command);
            return AccessRequestStatus.PENDING;
        },
    });

    const queryBus = new QueryBus();
    queryBus.register(GetUserByEmailQuery.queryName, { handle: async () => stored });

    const policy = new AccessPolicy(new AuthEmail(ADMIN));
    const handler = new ProvisionUserFromOAuthHandler(allowList(...options.allowed), policy, commandBus, queryBus);

    return { handler, created, recorded };
}

describe('ProvisionUserFromOAuthHandler', () => {
    it('enregistre une demande d’accès quand l’adresse n’est pas autorisée', async () => {
        const { handler, recorded, created } = harness({ allowed: [] });

        const outcome = await handler.handle(
            new ProvisionUserFromOAuthCommand('inconnu@example.com', 'Jean', 'Dupont'),
        );

        expect(outcome).toEqual({ kind: 'accessRequested', status: AccessRequestStatus.PENDING });
        expect(recorded).toHaveLength(1);
        expect(recorded[0].displayName).toBe('Jean Dupont');
        // Aucun compte : être connu d'un fournisseur OAuth n'ouvre aucun droit ici.
        expect(created).toHaveLength(0);
    });

    it('crée le compte avec le rôle view à la première connexion d’une adresse autorisée', async () => {
        const { handler, created } = harness({ allowed: ['visiteur@example.com'] });

        const outcome = await handler.handle(
            new ProvisionUserFromOAuthCommand('visiteur@example.com', 'Jean', 'Dupont'),
        );

        expect(created).toHaveLength(1);
        expect(created[0].roles).toEqual([UserRole.VIEW]);
        expect(outcome).toEqual({
            kind: 'session',
            user: { id: created[0].id, email: 'visiteur@example.com', roles: [UserRole.VIEW], tokenVersion: 0 },
        });
    });

    it('crée le compte d’amorçage avec le rôle edit', async () => {
        const { handler, created } = harness({ allowed: [ADMIN] });

        await handler.handle(new ProvisionUserFromOAuthCommand(ADMIN, 'Admin', 'Istrateur'));

        expect(created[0].roles).toEqual([UserRole.EDIT]);
    });

    it('normalise l’adresse avant toute décision', async () => {
        const { handler, created } = harness({ allowed: ['visiteur@example.com'] });

        await handler.handle(new ProvisionUserFromOAuthCommand('  Visiteur@Example.COM ', 'Jean', 'Dupont'));

        expect(created).toHaveLength(1);
        expect(created[0].email).toBe('visiteur@example.com');
    });

    it('ouvre la session d’un compte existant sans le recréer', async () => {
        const existing: UserDto = {
            id: 'u1',
            name: 'Jean',
            surname: 'Dupont',
            email: 'visiteur@example.com',
            roles: [UserRole.EDIT],
            tokenVersion: 3,
        };
        const { handler, created } = harness({ allowed: ['visiteur@example.com'], existingUser: existing });

        const outcome = await handler.handle(
            new ProvisionUserFromOAuthCommand('visiteur@example.com', 'Jean', 'Dupont'),
        );

        expect(created).toHaveLength(0);
        expect(outcome).toEqual({
            kind: 'session',
            // `tokenVersion` suit le compte : c'est elle qui invalide les jetons plus anciens.
            user: { id: 'u1', email: 'visiteur@example.com', roles: [UserRole.EDIT], tokenVersion: 3 },
        });
    });

    it('ouvre la session quand un callback concurrent a créé le compte entre-temps', async () => {
        const concurrent: UserDto = {
            id: 'u1',
            name: 'Jean',
            surname: 'Dupont',
            email: 'visiteur@example.com',
            roles: [UserRole.VIEW],
            tokenVersion: 0,
        };
        // Deux onglets, deux callbacks : au premier regard le compte n'existe pas, la création
        // se heurte à l'unicité, et la relecture le retrouve — créé par l'autre onglet.
        const handler = racingHandler({ createdByTheOtherTab: concurrent });

        const outcome = await handler.handle(
            new ProvisionUserFromOAuthCommand('visiteur@example.com', 'Jean', 'Dupont'),
        );

        expect(outcome).toEqual({
            kind: 'session',
            user: { id: 'u1', email: 'visiteur@example.com', roles: [UserRole.VIEW], tokenVersion: 0 },
        });
    });

    it('refuse d’ouvrir une session si le compte reste introuvable après création', async () => {
        // La création a échoué pour une raison qui n'est pas la concurrence, ou l'écriture
        // n'a pas pris. Ouvrir une session sans compte derrière serait pire que refuser.
        const handler = racingHandler({ createdByTheOtherTab: null });

        await expect(
            handler.handle(new ProvisionUserFromOAuthCommand('visiteur@example.com', 'Jean', 'Dupont')),
        ).rejects.toThrow('User provisioning failed');
    });
});

/** Le compte n'existe pas au premier regard, la création échoue sur l'unicité, puis on relit. */
function racingHandler({ createdByTheOtherTab }: { createdByTheOtherTab: UserDto | null }) {
    const commandBus = new CommandBus();
    commandBus.register(CreateUserCommand.commandName, {
        handle: async (command: CreateUserCommand) => {
            throw new UserAlreadyExistsException(command.email);
        },
    });

    const queryBus = new QueryBus();
    let firstLook = true;
    queryBus.register(GetUserByEmailQuery.queryName, {
        handle: async () => {
            if (firstLook) {
                firstLook = false;
                return null;
            }
            return createdByTheOtherTab;
        },
    });

    return new ProvisionUserFromOAuthHandler(
        allowList('visiteur@example.com'),
        new AccessPolicy(new AuthEmail(ADMIN)),
        commandBus,
        queryBus,
    );
}
