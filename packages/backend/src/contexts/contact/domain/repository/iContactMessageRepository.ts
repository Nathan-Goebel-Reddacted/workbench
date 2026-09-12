import { ContactMessage } from '../contactMessageAggregate';
import { ContactMessageId } from '../valueObject/contactMessageId';

export interface IContactMessageRepository {
    findAll(): Promise<ContactMessage[]>;
    save(message: ContactMessage): Promise<void>;
    delete(id: ContactMessageId): Promise<void>;
    deleteAll(): Promise<void>;
}
