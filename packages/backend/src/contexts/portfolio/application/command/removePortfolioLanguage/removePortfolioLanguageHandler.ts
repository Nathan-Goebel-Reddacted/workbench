import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { RemovePortfolioLanguageCommand } from "./removePortfolioLanguageCommand";
import { IPortfolioRepository } from "../../../domain/repository/iPortfolioRepository";
import { Language, LanguageEnum } from "../../../domain/value-objects/language";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class RemovePortfolioLanguageHandler implements ICommandHandler<RemovePortfolioLanguageCommand> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(command: RemovePortfolioLanguageCommand): Promise<void> {
        const portfolio = await this.repository.findById(command.portfolioId);
        if (!portfolio) throw new NotFoundError("Portfolio", command.portfolioId);
        portfolio.removeLanguage(new Language(command.language as LanguageEnum));
        await this.repository.save(portfolio);
    }
}
