import { Command } from "@shared/application/command/command";

export class AddTicketDocumentCommand implements Command {
    static readonly commandName = "ticket.AddTicketDocument";
    readonly commandName: string;

    constructor(
        readonly ticketId: string,
        readonly documentId: string,
        readonly name: string,
        readonly url: string,
        readonly type: string,
    ) {
        this.commandName = AddTicketDocumentCommand.commandName;
    }
}
