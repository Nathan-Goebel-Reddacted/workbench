import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { MoveSectionCommand } from './moveSectionCommand';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository';
import { SectionId } from '../../../domain/valueObject/sectionId';
import { GridPosition } from '../../../domain/valueObject/gridPosition';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { PageLayoutId } from '../../../domain/valueObject/pageLayoutId';

export class MoveSectionHandler implements ICommandHandler<MoveSectionCommand> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(command: MoveSectionCommand): Promise<void> {
        const pageLayout = await this.repository.findById(new PageLayoutId(command.pageLayoutId));
        if (!pageLayout) throw new NotFoundError('PageLayout', command.pageLayoutId);
        pageLayout.moveSection(
            new SectionId(command.sectionId),
            new GridPosition(command.x, command.y, command.w, command.h),
        );
        await this.repository.save(pageLayout);
    }
}
