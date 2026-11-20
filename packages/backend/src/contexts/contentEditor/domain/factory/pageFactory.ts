import { Page } from '../pageAggregate';
import { PageId } from '../valueObject/pageId';
import { PageType } from '../valueObject/pageType';
import { PageRef } from '../valueObject/pageRef';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';

export class PageFactory {
    create(id: string, pageType: string, pageRef: string): Page {
        return new Page(new PageId(id), parseEnum(pageType, PageType, 'page type'), new PageRef(pageRef));
    }
}
