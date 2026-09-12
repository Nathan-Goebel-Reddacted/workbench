import { ContactMessage } from '../contactMessageAggregate';

export interface IContactMessageRepository {
    findAll(): Promise<ContactMessage[]>;
    save(message: ContactMessage): Promise<void>;
    delete(id: string): Promise<void>;
    deleteAll(): Promise<void>;
}
