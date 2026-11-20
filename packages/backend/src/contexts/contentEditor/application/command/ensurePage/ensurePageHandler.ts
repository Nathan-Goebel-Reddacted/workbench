import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { EnsurePageCommand } from './ensurePageCommand';
import { IPageRepository, PageVersionConflictError } from '../../../domain/repository/iPageRepository';
import { PageFactory } from '../../../domain/factory/pageFactory';

export class EnsurePageHandler implements ICommandHandler<EnsurePageCommand> {
    constructor(
        private readonly repository: IPageRepository,
        private readonly factory: PageFactory,
    ) {}

    async handle(command: EnsurePageCommand): Promise<void> {
        const page = this.factory.create(command.id, command.pageType, command.pageRef);
        if (await this.repository.findByRef(page.getPageType(), page.getPageRef())) return;
        try {
            await this.repository.save(page);
        } catch (error) {
            if (!(error instanceof PageVersionConflictError)) throw error;
        }
    }
}
