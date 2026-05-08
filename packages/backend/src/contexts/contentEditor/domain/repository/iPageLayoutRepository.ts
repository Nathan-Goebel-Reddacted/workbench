import { PageLayout } from "../pageLayoutAggregate";

export interface IPageLayoutRepository {
    findById(id: string): Promise<PageLayout | null>;
    findByRef(pageType: string, pageRef: string): Promise<PageLayout | null>;
    save(pageLayout: PageLayout): Promise<void>;
}
