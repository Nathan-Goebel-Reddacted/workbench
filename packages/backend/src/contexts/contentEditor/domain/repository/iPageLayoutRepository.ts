import { PageLayout } from '../pageLayoutAggregate';
import { PageLayoutId } from '../valueObject/pageLayoutId';
import { PageRef } from '../valueObject/pageRef';
import { PageType } from '../valueObject/pageType';

export interface IPageLayoutRepository {
    findById(id: PageLayoutId): Promise<PageLayout | null>;
    findByRef(pageType: PageType, pageRef: PageRef): Promise<PageLayout | null>;
    save(pageLayout: PageLayout): Promise<void>;
}
