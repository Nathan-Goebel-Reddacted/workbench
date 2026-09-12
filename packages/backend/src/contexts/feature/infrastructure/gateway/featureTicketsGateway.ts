import { IFeatureTicketsGateway } from '../../domain/port/iFeatureTicketsGateway';
import { ITicketRepository } from '@contexts/ticket/domain/repository/iTicketRepository';
import { FeatureId } from '@contexts/ticket/domain/valueObject/featureId';

/** Adaptateur vers le contexte Ticket, seul à savoir comment ses tickets sont rangés. */
export class FeatureTicketsGateway implements IFeatureTicketsGateway {
    constructor(private readonly tickets: ITicketRepository) {}

    async countOf(featureId: string): Promise<number> {
        return this.tickets.countByFeatureId(new FeatureId(featureId));
    }

    async deleteAllOf(featureId: string): Promise<string[]> {
        const doomed = await this.tickets.findByFeatureId(new FeatureId(featureId));
        await this.tickets.deleteByFeatureId(new FeatureId(featureId));
        return doomed.flatMap(t => t.getDocuments().map(d => d.getUrl()));
    }
}
