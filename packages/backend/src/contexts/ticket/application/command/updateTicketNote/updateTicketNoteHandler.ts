import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateTicketNoteCommand } from './updateTicketNoteCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { Note } from '../../../domain/valueObject/note';
import { NotFoundError } from '@shared/application/errors/notFoundError';

export class UpdateTicketNoteHandler implements ICommandHandler<UpdateTicketNoteCommand> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(command: UpdateTicketNoteCommand): Promise<void> {
        const ticket = await this.repository.findById(command.id);
        if (!ticket) throw new NotFoundError('Ticket', command.id);
        ticket.replaceNote(command.index, new Note(command.note));
        await this.repository.save(ticket);
    }
}
