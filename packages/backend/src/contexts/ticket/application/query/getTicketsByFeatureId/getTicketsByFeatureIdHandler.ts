import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetTicketsByFeatureIdQuery } from './getTicketsByFeatureIdQuery';
import { TicketDto } from '../getTicketById/ticketDto';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { IFeatureGateway } from '../../../domain/port/iFeatureGateway';
import { toTicketDto } from '../ticketDtoMapper';
import { FeatureId } from '../../../domain/valueObject/featureId';

export class GetTicketsByFeatureIdHandler implements IQueryHandler<GetTicketsByFeatureIdQuery, TicketDto[]> {
    constructor(
        private readonly repository: ITicketRepository,
        private readonly features: IFeatureGateway,
    ) {}

    async handle(query: GetTicketsByFeatureIdQuery): Promise<TicketDto[]> {
        const tickets = await this.repository.findByFeatureId(new FeatureId(query.featureId));
        // Tous ces tickets partagent la même feature : une seule question suffit pour le lot.
        const feature = await this.features.describe(query.featureId);
        const ownedByIdea = feature?.ownerType === 'idea';
        return tickets.map(t => toTicketDto(t, ownedByIdea));
    }
}
