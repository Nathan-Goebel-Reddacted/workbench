import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { CreatePortfolioCommand } from "./createPortfolioCommand";
import { IPortfolioRepository } from "../../../domain/repository/iPortfolioRepository";
import { PortfolioFactory } from "../../../domain/factory/portfolioFactory";

export class CreatePortfolioHandler implements ICommandHandler<CreatePortfolioCommand> {
    constructor(
        private readonly repository: IPortfolioRepository,
        private readonly factory: PortfolioFactory,
    ) {}

    async handle(command: CreatePortfolioCommand): Promise<void> {
        const portfolio = this.factory.create(
            command.id,
            command.userId,
            command.description,
            command.links,
        );
        await this.repository.save(portfolio);
    }
}
