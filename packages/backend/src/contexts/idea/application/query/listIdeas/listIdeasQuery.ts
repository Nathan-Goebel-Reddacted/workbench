import { Query } from '@shared/application/query/query';

export class ListIdeasQuery implements Query {
    static readonly queryName = 'idea.ListIdeas';
    readonly queryName = ListIdeasQuery.queryName;
}
