import { Query } from '@shared/application/query/query';
import { PairingStatusValue } from '../../../domain/valueObject/pairingStatus';

export class ListPairingRequestsQuery implements Query {
    static readonly queryName = 'aiAssistant.ListPairingRequests';
    readonly queryName: string;

    constructor(readonly status: PairingStatusValue | null = null) {
        this.queryName = ListPairingRequestsQuery.queryName;
    }
}
