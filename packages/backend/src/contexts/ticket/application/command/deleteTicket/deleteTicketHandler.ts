import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteTicketCommand } from './deleteTicketCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { TicketId } from '../../../domain/valueObject/ticketId';

export class DeleteTicketHandler implements ICommandHandler<DeleteTicketCommand> {
    constructor(
        private readonly repository: ITicketRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: DeleteTicketCommand): Promise<void> {
        const ticket = await this.repository.findById(new TicketId(command.id));
        await this.repository.delete(new TicketId(command.id));
        if (ticket) await this.uploads.release(ticket.getDocuments().map(d => d.getUrl()));
    }
}
