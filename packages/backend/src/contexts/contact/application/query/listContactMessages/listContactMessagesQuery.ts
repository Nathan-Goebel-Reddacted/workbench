import { Query } from '@shared/application/query/query';

export class ListContactMessagesQuery implements Query {
    static readonly queryName = 'contact.ListContactMessages';
    readonly queryName = ListContactMessagesQuery.queryName;
}
