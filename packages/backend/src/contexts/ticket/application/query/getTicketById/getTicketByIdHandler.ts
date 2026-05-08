import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetTicketByIdQuery } from "./getTicketByIdQuery";
import { TicketDto } from "./ticketDto";
import { ITicketRepository } from "../../../domain/repository/iTicketRepository";
import { Ticket } from "../../../domain/ticketAggregate";

export class GetTicketByIdHandler implements IQueryHandler<GetTicketByIdQuery, TicketDto | null> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(query: GetTicketByIdQuery): Promise<TicketDto | null> {
        const ticket = await this.repository.findById(query.id);
        if (!ticket) return null;
        return this.toDto(ticket);
    }

    private toDto(ticket: Ticket): TicketDto {
        return {
            id: ticket.getId().getValue(),
            reference: ticket.getReference().getValue(),
            featureId: ticket.getFeatureId().getValue(),
            title: ticket.getTitle().getValue(),
            description: ticket.getDescription().getValue(),
            status: ticket.getStatus(),
            notes: ticket.getNotes().map(n => n.getValue()),
            documents: ticket.getDocuments().map(d => ({
                id: d.getId().getValue(),
                name: d.getName(),
                url: d.getUrl(),
                type: d.getType(),
            })),
        };
    }
}
