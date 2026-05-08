import { Query } from "@shared/application/query/query";

export class GetProjectByIdQuery implements Query {
    static readonly queryName = "project.GetProjectById";
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetProjectByIdQuery.queryName;
    }
}
