import { Ticket } from '../ticketAggregate';
import { TicketId } from '../valueObject/ticketId';
import { FeatureId } from '../valueObject/featureId';

export interface ITicketRepository {
    findById(id: TicketId): Promise<Ticket | null>;
    findByFeatureId(featureId: FeatureId): Promise<Ticket[]>;
    /** Les tickets de plusieurs features d'un coup — même raison que `findByOwners`. */
    findByFeatureIds(featureIds: FeatureId[]): Promise<Ticket[]>;
    countByFeatureId(featureId: FeatureId): Promise<number>;
    /** Plus grand numéro déjà attribué dans cette feature ; 0 si elle n'a aucun ticket. */
    lastNumberOf(featureId: FeatureId): Promise<number>;
    save(ticket: Ticket): Promise<void>;
    delete(id: TicketId): Promise<void>;
    /** Supprime tous les tickets d'une feature — la cascade, quand la feature disparaît. */
    deleteByFeatureId(featureId: FeatureId): Promise<void>;
}
