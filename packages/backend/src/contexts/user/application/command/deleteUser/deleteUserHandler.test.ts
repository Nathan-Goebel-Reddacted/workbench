import { describe, expect, it } from 'vitest';
import { DeleteUserHandler } from './deleteUserHandler.js';
import { DeleteUserCommand } from './deleteUserCommand.js';
import { IUserRepository } from '../../../domain/repository/iUserRepository.js';
import { User } from '../../../domain/userAggregate.js';
import { UserId } from '../../../domain/valueObject/userId.js';
import { Name } from '../../../domain/valueObject/name.js';
import { Surname } from '../../../domain/valueObject/surname.js';
import { Email } from '../../../domain/valueObject/email.js';
import { SelfDeletionForbiddenException } from '../../../domain/exception/selfDeletionForbidden.js';
import { UserRole } from '@shared/domain/valueObject/userRole.js';

function user(email: string): User {
    return new User(new UserId(), new Name('goebel'), new Surname('nathan'), new Email(email), [UserRole.EDIT]);
}

function repository(users: User[]): IUserRepository {
    const store = new Map(users.map(u => [u.getId().getValue(), u]));
    return {
        findById: async id => store.get(id.getValue()) ?? null,
        findByEmail: async () => null,
        findAll: async () => [...store.values()],
        save: async () => {},
        deleteById: async id => {
            store.delete(id.getValue());
        },
    };
}

const transaction = { run: <T>(work: () => Promise<T>) => work() };

describe('DeleteUserHandler', () => {
    it('refuse qu’un compte se supprime lui-même', async () => {
        const self = user('a@b.test');
        const other = user('c@d.test');
        const repo = repository([self, other]);
        const id = self.getId().getValue();

        await expect(
            new DeleteUserHandler(repo, [], transaction).handle(new DeleteUserCommand(id, id)),
        ).rejects.toThrow(SelfDeletionForbiddenException);
        expect(await repo.findById(self.getId())).not.toBeNull();
    });

    it('supprime le compte visé par un autre éditeur', async () => {
        const target = user('a@b.test');
        const editor = user('c@d.test');
        const repo = repository([target, editor]);

        await new DeleteUserHandler(repo, [], transaction).handle(
            new DeleteUserCommand(target.getId().getValue(), editor.getId().getValue()),
        );

        expect(await repo.findById(target.getId())).toBeNull();
    });
});
