import { Command } from '@shared/application/command/command';

export class ChangeTicketStatusCommand implements Command {
    static readonly commandName = 'ticket.ChangeTicketStatus';
    readonly commandName: string;

    constructor(
        readonly ticketId: string,
        readonly status: string,
    ) {
        this.commandName = ChangeTicketStatusCommand.commandName;
    }
}
