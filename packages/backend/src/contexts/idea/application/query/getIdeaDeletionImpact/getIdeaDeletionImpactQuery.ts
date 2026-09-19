import { Query } from '@shared/application/query/query';

export class GetIdeaDeletionImpactQuery implements Query {
    static readonly queryName = 'idea.GetIdeaDeletionImpact';
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetIdeaDeletionImpactQuery.queryName;
    }
}
