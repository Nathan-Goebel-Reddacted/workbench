import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { DeleteTicketCommand } from './deleteTicketCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';

export class DeleteTicketHandler implements ICommandHandler<DeleteTicketCommand> {
    constructor(
        private readonly repository: ITicketRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: DeleteTicketCommand): Promise<void> {
        const ticket = await this.repository.findById(command.id);
        await this.repository.delete(command.id);
        if (ticket) await this.uploads.release(ticket.getDocuments().map(d => d.getUrl()));
    }
}
