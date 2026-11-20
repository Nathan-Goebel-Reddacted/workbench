import { Query } from '@shared/application/query/query';

export class GetMindmapQuery implements Query {
    static readonly queryName = 'shared.GetMindmap';
    readonly queryName = GetMindmapQuery.queryName;

    constructor(readonly filename: string) {}
}
