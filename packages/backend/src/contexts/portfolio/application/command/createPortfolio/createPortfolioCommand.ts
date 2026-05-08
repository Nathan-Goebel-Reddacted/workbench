import { Command } from "@shared/application/command/command";

type LinkInput = { url: string; displayText: string; logo: string };

export class CreatePortfolioCommand implements Command {
    static readonly commandName = "portfolio.CreatePortfolio";
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly userId: string,
        readonly description: string,
        readonly links: LinkInput[],
    ) {
        this.commandName = CreatePortfolioCommand.commandName;
    }
}
