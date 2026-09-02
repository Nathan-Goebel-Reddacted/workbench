import { Command } from '@shared/application/command/command';

export class AddPortfolioLanguageCommand implements Command {
    static readonly commandName = 'portfolio.AddPortfolioLanguage';
    readonly commandName: string;

    constructor(
        readonly portfolioId: string,
        readonly language: string,
    ) {
        this.commandName = AddPortfolioLanguageCommand.commandName;
    }
}
