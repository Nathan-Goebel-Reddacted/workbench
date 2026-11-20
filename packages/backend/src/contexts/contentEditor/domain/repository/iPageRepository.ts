import { Page } from '../pageAggregate';
import { PageId } from '../valueObject/pageId';
import { PageRef } from '../valueObject/pageRef';
import { PageType } from '../valueObject/pageType';

export class PageVersionConflictError extends Error {
    constructor(pageId: string) {
        super(`Page ${pageId} was changed by someone else`);
        this.name = 'PageVersionConflictError';
    }
}

export interface IPageRepository {
    findById(id: PageId): Promise<Page | null>;
    findByRef(pageType: PageType, pageRef: PageRef): Promise<Page | null>;
    findByRefs(pageType: PageType, pageRefs: readonly PageRef[]): Promise<Page[]>;
    /** @throws PageVersionConflictError when the stored page is no longer the version that was read */
    save(page: Page): Promise<void>;
}
