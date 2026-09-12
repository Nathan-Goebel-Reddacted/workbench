import { Portfolio } from '../portfolioAggregate';
import { PortfolioId } from '../valueObject/portfolioId';

export interface IPortfolioRepository {
    findById(id: PortfolioId): Promise<Portfolio | null>;
    find(): Promise<Portfolio | null>;
    save(portfolio: Portfolio): Promise<void>;
}
