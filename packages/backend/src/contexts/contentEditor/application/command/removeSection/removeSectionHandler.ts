import { ICommandHandler } from '@shared/application/command/iCommandHandler';
import { RemoveSectionCommand } from './removeSectionCommand';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository';
import { SectionId } from '../../../domain/valueObject/sectionId';
import { NotFoundError } from '@shared/application/errors/notFoundError';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { PageLayoutId } from '../../../domain/valueObject/pageLayoutId';

export class RemoveSectionHandler implements ICommandHandler<RemoveSectionCommand> {
    constructor(
        private readonly repository: IPageLayoutRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async handle(command: RemoveSectionCommand): Promise<void> {
        const pageLayout = await this.repository.findById(new PageLayoutId(command.pageLayoutId));
        if (!pageLayout) throw new NotFoundError('PageLayout', command.pageLayoutId);
        const removed = pageLayout.getSections().find(s => s.getId().getValue() === command.sectionId);
        pageLayout.removeSection(new SectionId(command.sectionId));
        await this.repository.save(pageLayout);
        // Le contenu est du JSON libre : le stockage y cherche lui-même les URLs.
        if (removed) await this.uploads.releaseFromContent(removed.getContent());
    }
}
