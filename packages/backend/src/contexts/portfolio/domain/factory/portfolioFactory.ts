import { Portfolio } from '../portfolioAggregate';
import { PortfolioId } from '../valueObject/portfolioId';

export class PortfolioFactory {
    create(id: string): Portfolio {
        return new Portfolio(new PortfolioId(id));
    }
}
