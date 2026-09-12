import { Query } from '@shared/application/query/query';

export class ListPairingRequestsQuery implements Query {
    static readonly queryName = 'aiAssistant.ListPairingRequests';
    readonly queryName: string;

    constructor() {
        this.queryName = ListPairingRequestsQuery.queryName;
    }
}
