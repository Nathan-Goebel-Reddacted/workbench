import { Ticket } from '../ticketAggregate';

export interface ITicketRepository {
    findById(id: string): Promise<Ticket | null>;
    findByFeatureId(featureId: string): Promise<Ticket[]>;
    countByFeatureId(featureId: string): Promise<number>;
    /** Plus grand numéro déjà attribué dans cette feature ; 0 si elle n'a aucun ticket. */
    lastNumberOf(featureId: string): Promise<number>;
    existsByReference(reference: string): Promise<boolean>;
    save(ticket: Ticket): Promise<void>;
    delete(id: string): Promise<void>;
    /** Supprime tous les tickets d'une feature — la cascade, quand la feature disparaît. */
    deleteByFeatureId(featureId: string): Promise<void>;
}
