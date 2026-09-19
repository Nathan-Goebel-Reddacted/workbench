import { Query } from '@shared/application/query/query';

export class GetFeatureDeletionImpactQuery implements Query {
    static readonly queryName = 'feature.GetFeatureDeletionImpact';
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetFeatureDeletionImpactQuery.queryName;
    }
}
