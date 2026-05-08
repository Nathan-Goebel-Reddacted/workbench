import { Ticket } from "../ticketAggregate";

export interface ITicketRepository {
    findById(id: string): Promise<Ticket | null>;
    findByFeatureId(featureId: string): Promise<Ticket[]>;
    countByFeatureId(featureId: string): Promise<number>;
    existsByReference(reference: string): Promise<boolean>;
    save(ticket: Ticket): Promise<void>;
}
