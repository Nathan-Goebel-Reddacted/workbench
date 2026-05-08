import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetPortfolioByUserIdQuery } from "./getPortfolioByUserIdQuery";
import { PortfolioDto } from "../getPortfolioById/portfolioDto";
import { IPortfolioRepository } from "../../../domain/repository/iPortfolioRepository";
import { Portfolio } from "../../../domain/portfolioAggregate";

export class GetPortfolioByUserIdHandler implements IQueryHandler<GetPortfolioByUserIdQuery, PortfolioDto | null> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(query: GetPortfolioByUserIdQuery): Promise<PortfolioDto | null> {
        const portfolio = await this.repository.findByUserId(query.userId);
        if (!portfolio) return null;
        return this.toDto(portfolio);
    }

    private toDto(portfolio: Portfolio): PortfolioDto {
        return {
            id: portfolio.getId().getValue(),
            userId: portfolio.getUserId().getValue(),
            description: portfolio.getDescription().getValue(),
            languages: portfolio.getLanguages().map(l => l.getValue()),
            links: portfolio.getLinks().map(l => ({
                url: l.getUrl(),
                displayText: l.getDisplayText(),
                logo: l.getLogo(),
            })),
        };
    }
}
