import { Query } from "@shared/application/query/query";

export class GetIdeaByIdQuery implements Query {
    static readonly queryName = "idea.GetIdeaById";
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetIdeaByIdQuery.queryName;
    }
}
