import { Command } from '@shared/application/command/command';

export class DeleteTicketCommand implements Command {
    static readonly commandName = 'ticket.DeleteTicket';
    readonly commandName = DeleteTicketCommand.commandName;

    constructor(readonly id: string) {}
}
