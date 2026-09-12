import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetPortfolioByIdQuery } from './getPortfolioByIdQuery';
import { PortfolioDto } from './portfolioDto';
import { IPortfolioRepository } from '../../../domain/repository/iPortfolioRepository';
import { Portfolio } from '../../../domain/portfolioAggregate';
import { PortfolioId } from '../../../domain/valueObject/portfolioId';

export class GetPortfolioByIdHandler implements IQueryHandler<GetPortfolioByIdQuery, PortfolioDto | null> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(query: GetPortfolioByIdQuery): Promise<PortfolioDto | null> {
        const portfolio = await this.repository.findById(new PortfolioId(query.id));
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
