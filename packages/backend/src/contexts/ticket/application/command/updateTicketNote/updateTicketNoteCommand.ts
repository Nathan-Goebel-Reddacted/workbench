import { Command } from '@shared/application/command/command';

export class UpdateTicketNoteCommand implements Command {
    static readonly commandName = 'ticket.UpdateTicketNote';
    readonly commandName = UpdateTicketNoteCommand.commandName;

    constructor(
        readonly id: string,
        readonly index: number,
        readonly note: string,
    ) {}
}
