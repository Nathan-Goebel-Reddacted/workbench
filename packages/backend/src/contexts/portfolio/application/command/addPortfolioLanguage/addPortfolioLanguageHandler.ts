import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { AddPortfolioLanguageCommand } from './addPortfolioLanguageCommand';
import { IPortfolioRepository } from '../../../domain/repository/iPortfolioRepository';
import { Language, LanguageEnum } from '../../../domain/valueObject/language';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { PortfolioId } from '../../../domain/valueObject/portfolioId';

export class AddPortfolioLanguageHandler implements ICommandHandler<AddPortfolioLanguageCommand> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(command: AddPortfolioLanguageCommand): Promise<void> {
        const portfolio = await this.repository.findById(new PortfolioId(command.portfolioId));
        if (!portfolio) throw new NotFoundError('Portfolio', command.portfolioId);
        portfolio.addLanguage(new Language(command.language as LanguageEnum));
        await this.repository.save(portfolio);
    }
}
