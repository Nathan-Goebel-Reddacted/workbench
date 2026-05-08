import { Command } from "@shared/application/command/command";

export class RemovePortfolioLinkCommand implements Command {
    static readonly commandName = "portfolio.RemovePortfolioLink";
    readonly commandName: string;

    constructor(
        readonly portfolioId: string,
        readonly url: string,
        readonly displayText: string,
        readonly logo: string,
    ) {
        this.commandName = RemovePortfolioLinkCommand.commandName;
    }
}
