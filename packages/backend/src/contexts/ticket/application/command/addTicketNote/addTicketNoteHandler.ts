import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddTicketNoteCommand } from './addTicketNoteCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { Note } from '../../../domain/valueObject/note';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { TicketId } from '../../../domain/valueObject/ticketId';

export class AddTicketNoteHandler implements ICommandHandler<AddTicketNoteCommand> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(command: AddTicketNoteCommand): Promise<void> {
        const ticket = await this.repository.findById(new TicketId(command.ticketId));
        if (!ticket) throw new NotFoundError('Ticket', command.ticketId);
        ticket.addNote(new Note(command.note));
        await this.repository.save(ticket);
    }
}
