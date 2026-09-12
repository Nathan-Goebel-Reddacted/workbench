import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreateTicketCommand } from './createTicketCommand';
import { ITicketRepository } from '../../../domain/repository/iTicketRepository';
import { IFeatureGateway } from '../../../domain/port/iFeatureGateway';
import { TicketFactory } from '../../../domain/factory/ticketFactory';
import { TicketReference } from '../../../domain/valueObject/reference';
import { DuplicateReferenceException } from '../../../domain/exception/duplicateReferenceException';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { FeatureId } from '../../../domain/valueObject/featureId';

/** Deux tickets créés en même temps dans la même feature calculent le même numéro : on retente. */
const MAX_ATTEMPTS = 5;

export class CreateTicketHandler implements ICommandHandler<CreateTicketCommand> {
    constructor(
        private readonly repository: ITicketRepository,
        private readonly factory: TicketFactory,
        private readonly features: IFeatureGateway,
    ) {}

    async handle(command: CreateTicketCommand): Promise<void> {
        // La référence n'est plus fournie par l'appelant : elle se déduit de la feature et de son
        // porteur, seuls détenteurs des deux premiers segments.
        const feature = await this.features.describe(command.featureId);
        if (!feature) throw new NotFoundError('Feature', command.featureId);

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const position = (await this.repository.lastNumberOf(new FeatureId(command.featureId))) + 1;
            const reference = TicketReference.create(feature.ownerNumber, feature.featureNumber, position);
            const ticket = this.factory.create(
                command.id,
                command.featureId,
                reference,
                command.title,
                command.description,
            );
            try {
                await this.repository.save(ticket);
                return;
            } catch (err) {
                if (err instanceof DuplicateReferenceException && attempt < MAX_ATTEMPTS) continue;
                throw err;
            }
        }
    }
}
