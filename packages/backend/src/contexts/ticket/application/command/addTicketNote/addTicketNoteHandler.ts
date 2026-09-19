import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddTicketNoteCommand } from './addTicketNoteCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { Note } from '../../../domain/entity/note';
import { NoteId } from '../../../domain/valueObject/noteId';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { TicketId } from '../../../domain/valueObject/ticketId';
import { TicketNoteDto } from '../ticketNoteDto';

export class AddTicketNoteHandler implements ICommandHandler<AddTicketNoteCommand, TicketNoteDto> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(command: AddTicketNoteCommand): Promise<TicketNoteDto> {
        const ticket = await this.repository.findById(new TicketId(command.ticketId));
        if (!ticket) throw new NotFoundError('Ticket', command.ticketId);
        const note = new Note(new NoteId(command.noteId), command.note);
        ticket.addNote(note);
        await this.repository.save(ticket);
        return { id: note.getId().getValue(), text: note.getText() };
    }
}
