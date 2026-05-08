import { Command } from "@shared/application/command/command";

export class RemoveTicketDocumentCommand implements Command {
    static readonly commandName = "ticket.RemoveTicketDocument";
    readonly commandName: string;

    constructor(
        readonly ticketId: string,
        readonly documentId: string,
    ) {
        this.commandName = RemoveTicketDocumentCommand.commandName;
    }
}
