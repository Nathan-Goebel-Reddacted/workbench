import { Command } from '@shared/application/command/command';

export class UpdateTicketCommand implements Command {
    static readonly commandName = 'ticket.UpdateTicket';
    readonly commandName = UpdateTicketCommand.commandName;

    constructor(
        readonly id: string,
        readonly title: string,
        readonly description: string,
    ) {}
}
