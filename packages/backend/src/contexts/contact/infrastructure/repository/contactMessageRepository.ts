import { EntityManager } from '@mikro-orm/postgresql';
import { IContactMessageRepository } from '../../domain/repository/iContactMessageRepository';
import { ContactMessage } from '../../domain/contactMessageAggregate';
import { ContactMessageOrmEntity } from '../entity/contactMessageOrmEntity';

export class ContactMessageRepository implements IContactMessageRepository {
    constructor(private readonly em: EntityManager) {}

    async save(message: ContactMessage): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(ContactMessageOrmEntity, this.toOrm(message));
        });
    }

    private toOrm(message: ContactMessage): ContactMessageOrmEntity {
        const e = new ContactMessageOrmEntity();
        e.id = message.getId();
        e.fields = message.getFields();
        e.senderEmail = message.getSenderEmail();
        e.submittedAt = message.getSubmittedAt();
        e.mailSent = message.isMailSent();
        return e;
    }
}
