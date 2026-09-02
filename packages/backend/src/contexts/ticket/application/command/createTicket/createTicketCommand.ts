import { Command } from '@shared/application/command/command';

export class CreateTicketCommand implements Command {
    static readonly commandName = 'ticket.CreateTicket';
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly featureId: string,
        readonly title: string,
        readonly description: string,
    ) {
        this.commandName = CreateTicketCommand.commandName;
    }
}
