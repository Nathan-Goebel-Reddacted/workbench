import { NotFoundError } from '@shared/application/errors/notFoundError';
import { IUploadStorage } from '@shared/application/port/iUploadStorage';
import { IPageRepository, PageVersionConflictError } from '../../domain/repository/iPageRepository';
import { Page } from '../../domain/pageAggregate';
import { PageId } from '../../domain/valueObject/pageId';

export const MAX_ATTEMPTS = 3;

export type PageChange = (page: Page) => readonly unknown[];

export class PageMutator {
    constructor(
        private readonly repository: IPageRepository,
        private readonly uploads: IUploadStorage,
    ) {}

    async apply(pageId: string, change: PageChange): Promise<void> {
        for (let attempt = 1; ; attempt++) {
            const page = await this.repository.findById(new PageId(pageId));
            if (!page) throw new NotFoundError('Page', pageId);
            const released = change(page);
            try {
                await this.repository.save(page);
            } catch (error) {
                if (error instanceof PageVersionConflictError && attempt < MAX_ATTEMPTS) continue;
                throw error;
            }
            if (released.length > 0) await this.uploads.releaseFromContent(released);
            return;
        }
    }
}
