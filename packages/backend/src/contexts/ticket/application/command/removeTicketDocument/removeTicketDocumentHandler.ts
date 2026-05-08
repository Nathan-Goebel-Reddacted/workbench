import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { RemoveTicketDocumentCommand } from "./removeTicketDocumentCommand";
import { ITicketRepository } from "../../../domain/repository/iTicketRepository";
import { DocumentId } from "@shared/domain/valueObject/documentId";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class RemoveTicketDocumentHandler implements ICommandHandler<RemoveTicketDocumentCommand> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(command: RemoveTicketDocumentCommand): Promise<void> {
        const ticket = await this.repository.findById(command.ticketId);
        if (!ticket) throw new NotFoundError("Ticket", command.ticketId);
        ticket.removeDocument(new DocumentId(command.documentId));
        await this.repository.save(ticket);
    }
}
