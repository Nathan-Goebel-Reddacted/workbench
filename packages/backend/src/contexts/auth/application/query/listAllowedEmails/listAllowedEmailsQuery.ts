import { Query } from '@shared/application/query/query';

export class ListAllowedEmailsQuery implements Query {
    static readonly queryName = 'auth.ListAllowedEmails';
    readonly queryName = ListAllowedEmailsQuery.queryName;
}
