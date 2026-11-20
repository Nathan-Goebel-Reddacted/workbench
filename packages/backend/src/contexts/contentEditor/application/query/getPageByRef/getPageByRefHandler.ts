import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetPageByRefQuery } from './getPageByRefQuery';
import { PageDto } from '../pageDto';
import { IPageRepository } from '../../../domain/repository/iPageRepository';
import { IPageVisibility } from '../../../domain/port/iPageVisibility';
import { PageType } from '../../../domain/valueObject/pageType';
import { PageRef } from '../../../domain/valueObject/pageRef';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';
import { PageReaders, toPageDto } from '../pageDtoMapper';

export class GetPageByRefHandler implements IQueryHandler<GetPageByRefQuery, PageDto | null> {
    constructor(
        private readonly repository: IPageRepository,
        private readonly visibility: IPageVisibility,
        private readonly readers: PageReaders,
    ) {}

    async handle(query: GetPageByRefQuery): Promise<PageDto | null> {
        const pageType = parseEnum(query.pageType, PageType, 'page type');
        const pageRef = new PageRef(query.pageRef);

        if (!query.includeHidden && !(await this.visibility.isPublic(pageType, pageRef))) return null;

        const page = await this.repository.findByRef(pageType, pageRef);
        return page ? toPageDto(page, this.readers, query.forEditor ? 'editor' : 'public') : null;
    }
}
