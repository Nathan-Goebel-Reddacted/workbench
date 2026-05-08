import { Query } from "@shared/application/query/query";

export class GetPortfolioByIdQuery implements Query {
    static readonly queryName = "portfolio.GetPortfolioById";
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetPortfolioByIdQuery.queryName;
    }
}
