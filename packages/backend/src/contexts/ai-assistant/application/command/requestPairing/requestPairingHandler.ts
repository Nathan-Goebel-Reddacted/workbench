import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { IssuedPairing, RequestPairingCommand } from './requestPairingCommand';
import { IPairingRequestRepository } from '../../../domain/repository/iPairingRequestRepository';
import { PairingRequestFactory } from '../../../domain/factory/pairingRequestFactory';
import { MAX_PENDING_REQUESTS } from '../../../domain/pairingRequestAggregate';
import { TooManyPendingPairingRequests } from '../../../domain/exception/tooManyPendingPairingRequests';
import { generatePairingCode } from '../../auth/pairingCode';

export class RequestPairingHandler implements ICommandHandler<RequestPairingCommand, IssuedPairing> {
    constructor(
        private readonly repository: IPairingRequestRepository,
        private readonly factory: PairingRequestFactory,
    ) {}

    async handle(command: RequestPairingCommand): Promise<IssuedPairing> {
        // Les demandes périmées libèrent leur place avant qu'on compte : la file se mesure
        // à ce qui attend vraiment une décision.
        await this.repository.deleteExpired();

        if ((await this.repository.countPending()) >= MAX_PENDING_REQUESTS) {
            throw new TooManyPendingPairingRequests();
        }

        const code = generatePairingCode();
        const request = await this.factory.create(command.name, command.scopes, command.permission, code);
        await this.repository.save(request);

        return { code, expiresAt: request.getExpiresAt() };
    }
}
