import { Command } from '@shared/application/command/command';

export class UpdateTicketNoteCommand implements Command {
    static readonly commandName = 'ticket.UpdateTicketNote';
    readonly commandName = UpdateTicketNoteCommand.commandName;

    constructor(
        readonly id: string,
        readonly noteId: string,
        readonly note: string,
    ) {}
}
