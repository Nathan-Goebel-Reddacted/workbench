import { Query } from "@shared/application/query/query";

export class GetPortfolioByUserIdQuery implements Query {
    static readonly queryName = "portfolio.GetPortfolioByUserId";
    readonly queryName: string;

    constructor(readonly userId: string) {
        this.queryName = GetPortfolioByUserIdQuery.queryName;
    }
}
