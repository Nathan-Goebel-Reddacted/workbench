import { Query } from "@shared/application/query/query";

export class GetFeaturesByProjectIdQuery implements Query {
    static readonly queryName = "feature.GetFeaturesByProjectId";
    readonly queryName: string;

    constructor(readonly projectId: string) {
        this.queryName = GetFeaturesByProjectIdQuery.queryName;
    }
}
