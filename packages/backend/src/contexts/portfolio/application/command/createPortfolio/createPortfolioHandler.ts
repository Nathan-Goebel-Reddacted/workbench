import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { CreatePortfolioCommand } from './createPortfolioCommand';
import { IPortfolioRepository } from '../../../domain/repository/iPortfolioRepository';
import { PortfolioFactory } from '../../../domain/factory/portfolioFactory';
import { PortfolioAlreadyExistsException } from '../../../domain/exception/portfolioAlreadyExists';

export class CreatePortfolioHandler implements ICommandHandler<CreatePortfolioCommand> {
    constructor(
        private readonly repository: IPortfolioRepository,
        private readonly factory: PortfolioFactory,
    ) {}

    async handle(command: CreatePortfolioCommand): Promise<void> {
        // Le portfolio est unique par nature : un doublon rendrait arbitraire le portfolio
        // servi à la page d'accueil.
        if (await this.repository.find()) throw new PortfolioAlreadyExistsException();

        const portfolio = this.factory.create(command.id);
        await this.repository.save(portfolio);
    }
}
