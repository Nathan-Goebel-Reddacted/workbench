import { ICommandHandler } from "@shared/application/command/iCommandHandler";
import { UpdatePortfolioDescriptionCommand } from "./updatePortfolioDescriptionCommand";
import { IPortfolioRepository } from "../../../domain/repository/iPortfolioRepository";
import { Description } from "../../../domain/value-objects/description";
import { NotFoundError } from "@shared/application/errors/notFoundError";

export class UpdatePortfolioDescriptionHandler implements ICommandHandler<UpdatePortfolioDescriptionCommand> {
    constructor(private readonly repository: IPortfolioRepository) {}

    async handle(command: UpdatePortfolioDescriptionCommand): Promise<void> {
        const portfolio = await this.repository.findById(command.id);
        if (!portfolio) throw new NotFoundError("Portfolio", command.id);
        portfolio.setDescription(new Description(command.description));
        await this.repository.save(portfolio);
    }
}
