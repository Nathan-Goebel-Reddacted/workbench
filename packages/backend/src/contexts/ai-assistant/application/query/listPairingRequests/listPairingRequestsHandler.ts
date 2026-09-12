import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListPairingRequestsQuery } from './listPairingRequestsQuery';
import { PairingRequestDto, toPairingRequestDto } from './pairingRequestDto';
import { IPairingRequestRepository } from '../../../domain/repository/iPairingRequestRepository';

export class ListPairingRequestsHandler implements IQueryHandler<ListPairingRequestsQuery, PairingRequestDto[]> {
    constructor(private readonly requests: IPairingRequestRepository) {}

    async handle(): Promise<PairingRequestDto[]> {
        // Une demande périmée n'attend plus rien : elle disparaît avant d'être proposée à une décision.
        await this.requests.deleteExpired();

        return (await this.requests.findOpen()).map(toPairingRequestDto);
    }
}
