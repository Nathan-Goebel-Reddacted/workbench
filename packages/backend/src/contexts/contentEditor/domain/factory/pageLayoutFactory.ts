import { PageLayout } from '../pageLayoutAggregate';
import { PageLayoutId } from '../valueObject/pageLayoutId';
import { PageType } from '../valueObject/pageType';
import { PageRef } from '../valueObject/pageRef';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';

export class PageLayoutFactory {
    create(id: string, pageType: string, pageRef: string): PageLayout {
        return new PageLayout(new PageLayoutId(id), parseEnum(pageType, PageType, 'page type'), new PageRef(pageRef));
    }
}
