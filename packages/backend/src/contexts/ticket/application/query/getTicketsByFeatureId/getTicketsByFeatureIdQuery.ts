import { Query } from '@shared/application/query/query';

export class GetTicketsByFeatureIdQuery implements Query {
    static readonly queryName = 'ticket.GetTicketsByFeatureId';
    readonly queryName: string;

    constructor(readonly featureId: string) {
        this.queryName = GetTicketsByFeatureIdQuery.queryName;
    }
}
