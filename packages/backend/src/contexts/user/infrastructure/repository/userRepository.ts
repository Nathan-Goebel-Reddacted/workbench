import { EntityManager } from '@mikro-orm/postgresql';
import { IUserRepository } from '../../domain/repository/iUserRepository';
import { User } from '../../domain/userAggregate';
import { UserOrmEntity } from '../entity/userOrmEntity';
import { UserId } from '../../domain/valueObject/userId';
import { Name } from '../../domain/valueObject/name';
import { Surname } from '../../domain/valueObject/surname';
import { Email } from '../../domain/valueObject/email';
import { UserRole } from '../../domain/valueObject/role';

export class UserRepository implements IUserRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: string): Promise<User | null> {
        const e = await this.em.findOne(UserOrmEntity, { id });
        return e ? this.toDomain(e) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const e = await this.em.findOne(UserOrmEntity, { email });
        return e ? this.toDomain(e) : null;
    }

    async findAll(): Promise<User[]> {
        const rows = await this.em.findAll(UserOrmEntity);
        return rows.map(e => this.toDomain(e));
    }

    async existsById(id: string): Promise<boolean> {
        return (await this.em.count(UserOrmEntity, { id })) > 0;
    }

    async save(user: User): Promise<void> {
        await this.em.transactional(async (em) => {
            await em.upsert(UserOrmEntity, this.toOrm(user));
        });
    }

    async deleteById(id: string): Promise<void> {
        await this.em.nativeDelete(UserOrmEntity, { id });
    }

    private toDomain(e: UserOrmEntity): User {
        return new User(
            new UserId(e.id),
            new Name(e.name),
            new Surname(e.surname),
            new Email(e.email),
            e.roles.map(r => r as UserRole),
        );
    }

    private toOrm(user: User): UserOrmEntity {
        const e = new UserOrmEntity();
        e.id = user.getId().getValue();
        e.name = user.getName().getValue();
        e.surname = user.getSurname().getValue();
        e.email = user.getEmail().getValue();
        e.roles = user.getRoles();
        return e;
    }
}
