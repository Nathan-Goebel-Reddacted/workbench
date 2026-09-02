import { Ticket } from '../../domain/ticketAggregate';
import { TicketDto } from './getTicketById/ticketDto';

/** Une seule fabrique de DTO pour les deux lectures, sinon elles divergent. */
export function toTicketDto(ticket: Ticket, ownedByIdea: boolean): TicketDto {
    return {
        id: ticket.getId().getValue(),
        reference: ticket.getReference().getValue(),
        featureId: ticket.getFeatureId().getValue(),
        title: ticket.getTitle().getValue(),
        description: ticket.getDescription().getValue(),
        status: ticket.getStatus(),
        statusLocked: ownedByIdea,
        notes: ticket.getNotes().map(n => n.getValue()),
        documents: ticket.getDocuments().map(d => ({
            id: d.getId().getValue(),
            name: d.getName(),
            url: d.getUrl(),
            type: d.getType(),
        })),
    };
}
