import { Query } from "@shared/application/query/query";

export class GetUserByIdQuery implements Query {
    static readonly queryName = "user.GetUserById";
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetUserByIdQuery.queryName;
    }
}
