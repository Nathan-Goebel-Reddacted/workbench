import { EntityManager } from '@mikro-orm/postgresql';
import { IContactMessageRepository } from '../../domain/repository/iContactMessageRepository';
import { ContactMessage } from '../../domain/contactMessageAggregate';
import { ContactMessageOrmEntity } from '../entity/contactMessageOrmEntity';
import { ContactMessageFactory } from '../../domain/factory/contactMessageFactory';
import { ContactMessageId } from '../../domain/valueObject/contactMessageId';

export class ContactMessageRepository implements IContactMessageRepository {
    private readonly factory = new ContactMessageFactory();

    constructor(private readonly em: EntityManager) {}

    async findAll(): Promise<ContactMessage[]> {
        const entities = await this.em.find(ContactMessageOrmEntity, {}, { orderBy: { submittedAt: 'desc' } });
        return entities.map(e => this.toDomain(e));
    }

    async save(message: ContactMessage): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(ContactMessageOrmEntity, this.toOrm(message));
        });
    }

    async delete(id: ContactMessageId): Promise<void> {
        await this.em.transactional(async em => {
            await em.nativeDelete(ContactMessageOrmEntity, { id: id.getValue() });
        });
    }

    async deleteAll(): Promise<void> {
        await this.em.transactional(async em => {
            await em.nativeDelete(ContactMessageOrmEntity, {});
        });
    }

    private toDomain(e: ContactMessageOrmEntity): ContactMessage {
        return this.factory.rehydrate(e.id, e.fields, e.senderEmail, e.submittedAt, e.mailSent);
    }

    private toOrm(message: ContactMessage): ContactMessageOrmEntity {
        const e = new ContactMessageOrmEntity();
        e.id = message.getId().getValue();
        e.fields = message.getFields();
        e.senderEmail = message.getSenderEmail()?.getValue() ?? null;
        e.submittedAt = message.getSubmittedAt();
        e.mailSent = message.isMailSent();
        return e;
    }
}
