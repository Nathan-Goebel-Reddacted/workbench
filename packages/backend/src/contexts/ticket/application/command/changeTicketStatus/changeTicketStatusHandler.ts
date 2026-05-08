import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { ChangeTicketStatusCommand } from "./changeTicketStatusCommand";
import { ITicketRepository } from "../../../domain/repository/iTicketRepository";
import { TicketStatus } from "../../../domain/valueObject/status";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class ChangeTicketStatusHandler implements ICommandHandler<ChangeTicketStatusCommand> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(command: ChangeTicketStatusCommand): Promise<void> {
        const ticket = await this.repository.findById(command.ticketId);
        if (!ticket) throw new NotFoundError("Ticket", command.ticketId);
        ticket.setStatus(command.status as TicketStatus);
        await this.repository.save(ticket);
    }
}
