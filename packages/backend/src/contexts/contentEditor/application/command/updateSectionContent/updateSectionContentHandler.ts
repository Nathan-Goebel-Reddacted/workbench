import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { UpdateSectionContentCommand } from './updateSectionContentCommand';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository';
import { SectionId } from '../../../domain/valueObject/sectionId';
import { ContentRef } from '../../../domain/valueObject/contentRef';
import { NotFoundError } from '@shared/application/errors/notFoundError';

export class UpdateSectionContentHandler implements ICommandHandler<UpdateSectionContentCommand> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(command: UpdateSectionContentCommand): Promise<void> {
        const pageLayout = await this.repository.findById(command.pageLayoutId);
        if (!pageLayout) throw new NotFoundError('PageLayout', command.pageLayoutId);
        pageLayout.updateSectionContent(
            new SectionId(command.sectionId),
            command.content,
            command.contentRef ? new ContentRef(command.contentRef) : null,
        );
        await this.repository.save(pageLayout);
    }
}
