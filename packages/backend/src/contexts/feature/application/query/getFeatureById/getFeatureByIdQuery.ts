import { Query } from '@shared/application/query/query';

export class GetFeatureByIdQuery implements Query {
    static readonly queryName = 'feature.GetFeatureById';
    readonly queryName: string;

    constructor(
        readonly id: string,
        readonly includeHidden: boolean = true,
    ) {
        this.queryName = GetFeatureByIdQuery.queryName;
    }
}
