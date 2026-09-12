import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RecordAccessRequestCommand } from './recordAccessRequestCommand';
import { IAccessRequestRepository } from '../../../domain/repository/iAccessRequestRepository';
import { AccessRequest } from '../../../domain/accessRequestAggregate';
import { AccessRequestStatus } from '../../../domain/valueObject/accessRequestStatus';
import { AuthEmail } from '../../../domain/valueObject/email';

/**
 * Enregistre la tentative de connexion d'une adresse absente de la liste blanche, et rend
 * l'état dans lequel se trouve désormais la demande — c'est lui que l'écran d'attente affiche.
 */
export class RecordAccessRequestHandler implements ICommandHandler<RecordAccessRequestCommand, AccessRequestStatus> {
    constructor(private readonly repository: IAccessRequestRepository) {}

    async handle(command: RecordAccessRequestCommand): Promise<AccessRequestStatus> {
        const email = new AuthEmail(command.email);
        const existing = await this.repository.findByEmail(email);

        if (!existing) {
            const request = AccessRequest.open(email, command.displayName);
            await this.repository.save(request);
            return request.getStatus();
        }

        existing.renew(command.displayName);
        await this.repository.save(existing);
        return existing.getStatus();
    }
}
