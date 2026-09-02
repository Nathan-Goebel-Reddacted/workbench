import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetTicketByIdQuery } from './getTicketByIdQuery';
import { TicketDto } from './ticketDto';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { IFeatureGateway } from '../../../domain/port/iFeatureGateway';
import { toTicketDto } from '../ticketDtoMapper';

export class GetTicketByIdHandler implements IQueryHandler<GetTicketByIdQuery, TicketDto | null> {
    constructor(
        private readonly repository: ITicketRepository,
        private readonly features: IFeatureGateway,
    ) {}

    async handle(query: GetTicketByIdQuery): Promise<TicketDto | null> {
        const ticket = await this.repository.findById(query.id);
        if (!ticket) return null;
        const feature = await this.features.describe(ticket.getFeatureId().getValue());
        return toTicketDto(ticket, feature?.ownerType === 'idea');
    }
}
