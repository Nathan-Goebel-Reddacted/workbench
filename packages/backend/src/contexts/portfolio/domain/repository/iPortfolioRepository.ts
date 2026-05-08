import { Portfolio } from "../portfolioAggregate";

export interface IPortfolioRepository {
    findById(id: string): Promise<Portfolio | null>;
    findByUserId(userId: string): Promise<Portfolio | null>;
    save(portfolio: Portfolio): Promise<void>;
}
