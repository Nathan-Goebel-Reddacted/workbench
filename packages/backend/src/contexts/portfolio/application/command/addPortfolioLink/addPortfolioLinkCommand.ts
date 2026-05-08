import { Command } from "@shared/application/command/command";

export class AddPortfolioLinkCommand implements Command {
    static readonly commandName = "portfolio.AddPortfolioLink";
    readonly commandName: string;

    constructor(
        readonly portfolioId: string,
        readonly url: string,
        readonly displayText: string,
        readonly logo: string,
    ) {
        this.commandName = AddPortfolioLinkCommand.commandName;
    }
}
