import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateTicketNoteCommand } from './updateTicketNoteCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { NoteId } from '../../../domain/valueObject/noteId';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { TicketId } from '../../../domain/valueObject/ticketId';
import { TicketNoteDto } from '../ticketNoteDto';

export class UpdateTicketNoteHandler implements ICommandHandler<UpdateTicketNoteCommand, TicketNoteDto> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(command: UpdateTicketNoteCommand): Promise<TicketNoteDto> {
        const ticket = await this.repository.findById(new TicketId(command.id));
        if (!ticket) throw new NotFoundError('Ticket', command.id);
        const note = ticket.rewriteNote(new NoteId(command.noteId), command.note);
        await this.repository.save(ticket);
        return { id: note.getId().getValue(), text: note.getText() };
    }
}
