import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { ListPageRefsWithContentQuery } from './listPageRefsWithContentQuery';
import { IPageRepository } from '../../../domain/repository/iPageRepository';
import { PageType } from '../../../domain/valueObject/pageType';
import { PageRef } from '../../../domain/valueObject/pageRef';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';

export class ListPageRefsWithContentHandler implements IQueryHandler<ListPageRefsWithContentQuery, string[]> {
    constructor(private readonly repository: IPageRepository) {}

    async handle(query: ListPageRefsWithContentQuery): Promise<string[]> {
        const pageType = parseEnum(query.pageType, PageType, 'page type');
        const pages = await this.repository.findByRefs(
            pageType,
            query.pageRefs.map(ref => new PageRef(ref)),
        );
        return pages.filter(page => page.hasContent()).map(page => page.getPageRef().getValue());
    }
}
