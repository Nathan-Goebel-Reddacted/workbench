import { EntityManager } from '@mikro-orm/postgresql';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { IUserRepository } from '../../domain/repository/iUserRepository';
import { User } from '../../domain/userAggregate';
import { UserOrmEntity } from '../entity/userOrmEntity';
import { UserId } from '../../domain/valueObject/userId';
import { Name } from '../../domain/valueObject/name';
import { Surname } from '../../domain/valueObject/surname';
import { Email } from '../../domain/valueObject/email';
import { UserRole } from '../../domain/valueObject/role';
import { UserAlreadyExistsException } from '../../domain/exception/userAlreadyExists';

export class UserRepository implements IUserRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: UserId): Promise<User | null> {
        const e = await this.em.findOne(UserOrmEntity, { id: id.getValue() });
        return e ? this.toDomain(e) : null;
    }

    async findByEmail(email: Email): Promise<User | null> {
        const e = await this.em.findOne(UserOrmEntity, { email: email.getValue() });
        return e ? this.toDomain(e) : null;
    }

    async findAll(): Promise<User[]> {
        const rows = await this.em.findAll(UserOrmEntity);
        return rows.map(e => this.toDomain(e));
    }

    async save(user: User): Promise<void> {
        try {
            await this.em.transactional(async em => {
                await em.upsert(UserOrmEntity, this.toOrm(user));
            });
        } catch (error) {
            // L'adresse est unique en base. Deux connexions simultanées de la même personne
            // arrivent ici ; l'appelant a besoin de distinguer ce cas d'une vraie panne, et
            // le lui faire lire dans le texte du message dépendait du pilote.
            if (error instanceof UniqueConstraintViolationException) {
                throw new UserAlreadyExistsException(user.getEmail().getValue());
            }
            throw error;
        }
    }

    async deleteById(id: UserId): Promise<void> {
        await this.em.nativeDelete(UserOrmEntity, { id: id.getValue() });
    }

    private toDomain(e: UserOrmEntity): User {
        return new User(
            new UserId(e.id),
            new Name(e.name),
            new Surname(e.surname),
            new Email(e.email),
            e.roles.map(r => r as UserRole),
            e.tokenVersion,
        );
    }

    private toOrm(user: User): UserOrmEntity {
        const e = new UserOrmEntity();
        e.id = user.getId().getValue();
        e.name = user.getName().getValue();
        e.surname = user.getSurname().getValue();
        e.email = user.getEmail().getValue();
        e.roles = user.getRoles();
        e.tokenVersion = user.getTokenVersion();
        return e;
    }
}
