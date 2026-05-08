import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetTicketsByFeatureIdQuery } from "./getTicketsByFeatureIdQuery";
import { TicketDto } from "../getTicketById/ticketDto";
import { ITicketRepository } from "../../../domain/repository/iTicketRepository";
import { Ticket } from "../../../domain/ticketAggregate";

export class GetTicketsByFeatureIdHandler implements IQueryHandler<GetTicketsByFeatureIdQuery, TicketDto[]> {
    constructor(private readonly repository: ITicketRepository) {}

    async handle(query: GetTicketsByFeatureIdQuery): Promise<TicketDto[]> {
        const tickets = await this.repository.findByFeatureId(query.featureId);
        return tickets.map(t => this.toDto(t));
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
