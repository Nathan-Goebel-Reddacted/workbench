import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { EnsurePageLayoutCommand } from './ensurePageLayoutCommand';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository';
import { PageLayoutFactory } from '../../../domain/factory/pageLayoutFactory';

export class EnsurePageLayoutHandler implements ICommandHandler<EnsurePageLayoutCommand> {
    constructor(
        private readonly repository: IPageLayoutRepository,
        private readonly factory: PageLayoutFactory,
    ) {}

    async handle(command: EnsurePageLayoutCommand): Promise<void> {
        const pageLayout = this.factory.create(command.id, command.pageType, command.pageRef);
        const existing = await this.repository.findByRef(pageLayout.getPageType(), pageLayout.getPageRef());
        if (existing) return;
        await this.repository.save(pageLayout);
    }
}
