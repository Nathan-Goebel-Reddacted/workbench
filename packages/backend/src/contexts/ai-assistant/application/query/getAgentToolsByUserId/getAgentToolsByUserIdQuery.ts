import { Query } from "@shared/application/query/query";

export class GetAgentToolsByUserIdQuery implements Query {
    static readonly queryName = "aiAssistant.GetAgentToolsByUserId";
    readonly queryName: string;

    constructor(readonly userId: string) {
        this.queryName = GetAgentToolsByUserIdQuery.queryName;
    }
}
