import { Query } from '@shared/application/query/query';

export class ListAccessRequestsQuery implements Query {
    static readonly queryName = 'auth.ListAccessRequests';
    readonly queryName = ListAccessRequestsQuery.queryName;
}
