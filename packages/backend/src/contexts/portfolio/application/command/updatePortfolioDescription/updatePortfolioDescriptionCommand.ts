import { Command } from "@shared/application/command/command";

export class UpdatePortfolioDescriptionCommand implements Command {
    static readonly commandName = "portfolio.UpdatePortfolioDescription";
    readonly commandName: string;

    constructor(
        readonly id: string,
        readonly description: string,
    ) {
        this.commandName = UpdatePortfolioDescriptionCommand.commandName;
    }
}
