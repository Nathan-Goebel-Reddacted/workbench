import { Query } from '@shared/application/query/query';

export class GetPortfolioQuery implements Query {
    static readonly queryName = 'portfolio.GetPortfolio';
    readonly queryName: string;

    constructor() {
        this.queryName = GetPortfolioQuery.queryName;
    }
}
