import { PageLayout } from "../pageLayoutAggregate";
import { PageLayoutId } from "../valueObject/pageLayoutId";
import { PageType } from "../valueObject/pageType";
import { PageRef } from "../valueObject/pageRef";

export class PageLayoutFactory {
    create(id: string, pageType: string, pageRef: string): PageLayout {
        return new PageLayout(
            new PageLayoutId(id),
            pageType as PageType,
            new PageRef(pageRef),
        );
    }
}
