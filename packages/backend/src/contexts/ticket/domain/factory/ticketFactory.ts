import { Ticket } from "../ticketAggregate";
import { TicketId } from "../valueObject/ticketId";
import { FeatureId } from "../valueObject/featureId";
import { TicketReference } from "../valueObject/reference";
import { Title } from "../valueObject/title";
import { Description } from "../valueObject/description";
import { TicketStatus } from "../valueObject/status";

export class TicketFactory {
    create(
        id: string,
        featureId: string,
        reference: TicketReference,
        title: string,
        description: string,
        status: TicketStatus = TicketStatus.Pending,
    ): Ticket {
        return new Ticket(
            new TicketId(id),
            reference,
            new FeatureId(featureId),
            new Title(title),
            new Description(description),
            status,
        );
    }
}
