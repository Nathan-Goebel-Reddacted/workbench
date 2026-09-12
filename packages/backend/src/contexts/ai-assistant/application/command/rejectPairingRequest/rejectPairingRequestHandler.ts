import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RejectPairingRequestCommand } from './rejectPairingRequestCommand';
import { IPairingRequestRepository } from '../../../domain/repository/iPairingRequestRepository';
import { PairingRequestId } from '../../../domain/valueObject/pairingRequestId';

export class RejectPairingRequestHandler implements ICommandHandler<RejectPairingRequestCommand, boolean> {
    constructor(private readonly requests: IPairingRequestRepository) {}

    /** Rend `false` quand la demande n'existe pas — refuser deux fois, en revanche, reste sans effet de bord. */
    async handle(command: RejectPairingRequestCommand): Promise<boolean> {
        const request = await this.requests.findById(new PairingRequestId(command.id));
        if (!request) return false;

        request.reject();
        await this.requests.save(request);
        return true;
    }
}
