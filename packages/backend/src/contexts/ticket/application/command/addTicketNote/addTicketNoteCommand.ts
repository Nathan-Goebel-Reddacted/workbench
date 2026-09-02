import { Command } from '@shared/application/command/command';

export class AddTicketNoteCommand implements Command {
    static readonly commandName = 'ticket.AddTicketNote';
    readonly commandName: string;

    constructor(
        readonly ticketId: string,
        readonly note: string,
    ) {
        this.commandName = AddTicketNoteCommand.commandName;
    }
}
