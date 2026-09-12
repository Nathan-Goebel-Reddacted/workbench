import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddTicketDocumentCommand } from './addTicketDocumentCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { Document } from '@shared/domain/entity/document';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { DocumentType } from '@shared/domain/valueObject/documentType';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { TicketId } from '../../../domain/valueObject/ticketId';

export class AddTicketDocumentHandler implements ICommandHandler<AddTicketDocumentCommand> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(command: AddTicketDocumentCommand): Promise<void> {
        const ticket = await this.repository.findById(new TicketId(command.ticketId));
        if (!ticket) throw new NotFoundError('Ticket', command.ticketId);
        ticket.addDocument(
            new Document(new DocumentId(command.documentId), command.name, command.url, command.type as DocumentType),
        );
        await this.repository.save(ticket);
    }
}
