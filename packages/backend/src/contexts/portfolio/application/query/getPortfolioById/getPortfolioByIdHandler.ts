import { IQueryHandler } from "@shared/application/query/iQueryHandler";
import { GetPortfolioByIdQuery } from "./getPortfolioByIdQuery";
import { PortfolioDto } from "./portfolioDto";
import { IPortfolioRepository } from "../../../domain/repository/iPortfolioRepository";
import { Portfolio } from "../../../domain/portfolioAggregate";

export class GetPortfolioByIdHandler implements IQueryHandler<GetPortfolioByIdQuery, PortfolioDto | null> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(query: GetPortfolioByIdQuery): Promise<PortfolioDto | null> {
        const portfolio = await this.repository.findById(query.id);
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
