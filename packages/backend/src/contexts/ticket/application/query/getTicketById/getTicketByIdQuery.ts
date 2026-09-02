import { Query } from '@shared/application/query/query';

export class GetTicketByIdQuery implements Query {
    static readonly queryName = 'ticket.GetTicketById';
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetTicketByIdQuery.queryName;
    }
}
