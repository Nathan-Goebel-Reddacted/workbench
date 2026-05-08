import { Query } from "@shared/application/query/query";

export class GetPageLayoutByIdQuery implements Query {
    static readonly queryName = "contentEditor.GetPageLayoutById";
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetPageLayoutByIdQuery.queryName;
    }
}
