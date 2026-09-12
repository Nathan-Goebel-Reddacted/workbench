import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreateFeatureCommand } from './createFeatureCommand';
import { IFeatureRepository } from '../../../domain/repository/iFeatureRepository';
import { IOwnerGateway } from '../../../domain/port/iOwnerGateway';
import { FeatureFactory } from '../../../domain/factory/featureFactory';
import { FeatureOwner } from '../../../domain/valueObject/featureOwner';
import { DuplicateFeatureNumberException } from '../../../domain/exception/duplicateFeatureNumber';
import { UnknownFeatureOwnerException } from '../../../domain/exception/unknownFeatureOwner';

/** Deux créations simultanées chez le même porteur calculent le même numéro : la seconde retente. */
const MAX_ATTEMPTS = 5;

export class CreateFeatureHandler implements ICommandHandler<CreateFeatureCommand> {
    constructor(
        private readonly repository: IFeatureRepository,
        private readonly factory: FeatureFactory,
        private readonly owners: IOwnerGateway,
    ) {}

    async handle(command: CreateFeatureCommand): Promise<void> {
        const owner = new FeatureOwner(command.ownerType, command.ownerId);
        if (!(await this.owners.exists(owner))) {
            throw new UnknownFeatureOwnerException();
        }

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const number = (await this.repository.lastNumberOf(owner)) + 1;
            const feature = this.factory.create(
                command.id,
                command.ownerType,
                command.ownerId,
                number,
                command.name,
                command.description,
                command.documents,
            );
            try {
                await this.repository.save(feature);
                return;
            } catch (err) {
                // La contrainte (porteur + numéro) a tranché : quelqu'un a pris ce numéro entre
                // notre lecture et notre écriture. On relit et on recommence.
                if (err instanceof DuplicateFeatureNumberException && attempt < MAX_ATTEMPTS) continue;
                throw err;
            }
        }
    }
}
