import { Command } from '@shared/application/command/command';

export class CreatePortfolioCommand implements Command {
    static readonly commandName = 'portfolio.CreatePortfolio';
    readonly commandName: string;

    constructor(readonly id: string) {
        this.commandName = CreatePortfolioCommand.commandName;
    }
}
