import { User } from '../userAggregate';
import { UserId } from '../valueObject/userId';
import { Email } from '../valueObject/email';

export interface IUserRepository {
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    findAll(): Promise<User[]>;
    save(user: User): Promise<void>;
    deleteById(id: UserId): Promise<void>;
}
