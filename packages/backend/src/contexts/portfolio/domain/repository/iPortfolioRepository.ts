import { Portfolio } from '../portfolioAggregate';

export interface IPortfolioRepository {
    findById(id: string): Promise<Portfolio | null>;
    find(): Promise<Portfolio | null>;
    save(portfolio: Portfolio): Promise<void>;
}
