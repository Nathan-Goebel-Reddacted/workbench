import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListContactMessagesQuery } from './listContactMessagesQuery';
import { ContactMessageDto } from './contactMessageDto';
import { IContactMessageRepository } from '../../../domain/repository/iContactMessageRepository';
import { ContactMessage } from '../../../domain/contactMessageAggregate';

export class ListContactMessagesHandler implements IQueryHandler<ListContactMessagesQuery, ContactMessageDto[]> {
    constructor(private readonly repository: IContactMessageRepository) {}

    async handle(): Promise<ContactMessageDto[]> {
        const messages = await this.repository.findAll();
        return messages.map(message => this.toDto(message));
    }

    private toDto(message: ContactMessage): ContactMessageDto {
        return {
            id: message.getId(),
            fields: message.getFields(),
            senderEmail: message.getSenderEmail(),
            submittedAt: message.getSubmittedAt().toISOString(),
            mailSent: message.isMailSent(),
        };
    }
}
