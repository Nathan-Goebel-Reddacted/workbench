import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { RemovePortfolioLinkCommand } from "./removePortfolioLinkCommand";
import { IPortfolioRepository } from "../../../domain/repository/iPortfolioRepository";
import { Link } from "../../../domain/value-objects/link";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class RemovePortfolioLinkHandler implements ICommandHandler<RemovePortfolioLinkCommand> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(command: RemovePortfolioLinkCommand): Promise<void> {
        const portfolio = await this.repository.findById(command.portfolioId);
        if (!portfolio) throw new NotFoundError("Portfolio", command.portfolioId);
        portfolio.removeLink(new Link(command.url, command.displayText, command.logo));
        await this.repository.save(portfolio);
    }
}
