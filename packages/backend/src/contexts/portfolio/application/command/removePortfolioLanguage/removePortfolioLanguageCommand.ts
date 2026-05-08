import { Command } from "@shared/application/command/command";

export class RemovePortfolioLanguageCommand implements Command {
    static readonly commandName = "portfolio.RemovePortfolioLanguage";
    readonly commandName: string;

    constructor(
        readonly portfolioId: string,
        readonly language: string,
    ) {
        this.commandName = RemovePortfolioLanguageCommand.commandName;
    }
}
