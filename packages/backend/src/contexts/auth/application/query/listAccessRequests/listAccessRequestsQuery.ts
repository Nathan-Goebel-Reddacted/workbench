import { Query } from '@shared/application/query/query';
import { AccessRequestStatus } from '../../../domain/valueObject/accessRequestStatus';

export class ListAccessRequestsQuery implements Query {
    static readonly queryName = 'auth.ListAccessRequests';
    readonly queryName = ListAccessRequestsQuery.queryName;

    constructor(readonly status: AccessRequestStatus | null = null) {}
}
