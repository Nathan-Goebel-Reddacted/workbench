import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { AddPortfolioLinkCommand } from "./addPortfolioLinkCommand";
import { IPortfolioRepository } from "../../../domain/repository/iPortfolioRepository";
import { Link } from "../../../domain/value-objects/link";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class AddPortfolioLinkHandler implements ICommandHandler<AddPortfolioLinkCommand> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(command: AddPortfolioLinkCommand): Promise<void> {
        const portfolio = await this.repository.findById(command.portfolioId);
        if (!portfolio) throw new NotFoundError("Portfolio", command.portfolioId);
        portfolio.addLink(new Link(command.url, command.displayText, command.logo));
        await this.repository.save(portfolio);
    }
}
