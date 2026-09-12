import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveTicketDocumentCommand } from './removeTicketDocumentCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { DocumentId } from '@shared/domain/valueObject/documentId';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { TicketId } from '../../../domain/valueObject/ticketId';

export class RemoveTicketDocumentHandler implements ICommandHandler<RemoveTicketDocumentCommand> {
    constructor(
        private readonly repository: ITicketRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: RemoveTicketDocumentCommand): Promise<void> {
        const ticket = await this.repository.findById(new TicketId(command.ticketId));
        if (!ticket) throw new NotFoundError('Ticket', command.ticketId);
        const removed = ticket.getDocuments().find(d => d.getId().getValue() === command.documentId);
        ticket.removeDocument(new DocumentId(command.documentId));
        await this.repository.save(ticket);
        // Après le save : tant que la ligne porte encore le document, il se compte lui-même.
        if (removed) await this.uploads.release([removed.getUrl()]);
    }
}
