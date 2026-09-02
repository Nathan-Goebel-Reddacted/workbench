import { Query } from '@shared/application/query/query';

export class GetFeaturesByOwnerQuery implements Query {
    static readonly queryName = 'feature.GetFeaturesByOwner';
    readonly queryName: string;

    constructor(
        readonly ownerType: string,
        readonly ownerId: string,
    ) {
        this.queryName = GetFeaturesByOwnerQuery.queryName;
    }
}
