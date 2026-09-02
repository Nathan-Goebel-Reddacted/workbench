import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { ChangeTicketStatusCommand } from './changeTicketStatusCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { IFeatureGateway } from '../../../domain/port/iFeatureGateway';
import { TicketStatus } from '../../../domain/valueObject/status';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';

export class ChangeTicketStatusHandler implements ICommandHandler<ChangeTicketStatusCommand> {
    constructor(
        private readonly repository: ITicketRepository,
        private readonly features: IFeatureGateway,
    ) {}

    async handle(command: ChangeTicketStatusCommand): Promise<void> {
        const ticket = await this.repository.findById(command.ticketId);
        if (!ticket) throw new NotFoundError('Ticket', command.ticketId);

        // Le ticket ne sait pas ce qui porte sa feature : on le lui demande, puis on le lui dit.
        const feature = await this.features.describe(ticket.getFeatureId().getValue());
        if (!feature) throw new NotFoundError('Feature', ticket.getFeatureId().getValue());

        ticket.changeStatus(parseEnum(command.status, TicketStatus, 'ticket status'), feature.ownerType === 'idea');
        await this.repository.save(ticket);
    }
}
