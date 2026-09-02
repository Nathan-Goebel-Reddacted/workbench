import { User } from '../userAggregate';

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    existsById(id: string): Promise<boolean>;
    save(user: User): Promise<void>;
    deleteById(id: string): Promise<void>;
}
