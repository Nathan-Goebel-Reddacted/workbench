import { ContactMessage } from '../contactMessageAggregate';

export interface IContactMessageRepository {
    save(message: ContactMessage): Promise<void>;
}
