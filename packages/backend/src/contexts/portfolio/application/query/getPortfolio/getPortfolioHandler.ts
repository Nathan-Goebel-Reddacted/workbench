import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetPortfolioQuery } from './getPortfolioQuery';
import { PortfolioDto } from '../getPortfolioById/portfolioDto';
import { IPortfolioRepository } from '../../../domain/repository/iPortfolioRepository';
import { Portfolio } from '../../../domain/portfolioAggregate';

export class GetPortfolioHandler implements IQueryHandler<GetPortfolioQuery, PortfolioDto | null> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(): Promise<PortfolioDto | null> {
        const portfolio = await this.repository.find();
        if (!portfolio) return null;
        return this.toDto(portfolio);
    }

    private toDto(portfolio: Portfolio): PortfolioDto {
        return {
            id: portfolio.getId().getValue(),
            languages: portfolio.getLanguages().map(l => l.getValue()),
        };
    }
}
