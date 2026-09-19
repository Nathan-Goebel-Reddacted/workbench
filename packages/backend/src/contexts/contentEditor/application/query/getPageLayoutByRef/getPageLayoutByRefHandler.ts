import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetPageLayoutByRefQuery } from './getPageLayoutByRefQuery';
import { PageLayoutDto } from '../getPageLayoutById/pageLayoutDto';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository';
import { PageType } from '../../../domain/valueObject/pageType';
import { PageRef } from '../../../domain/valueObject/pageRef';
import { parseEnum } from '@shared/domain/valueObject/parseEnum';
import { toPageLayoutDto } from '../pageLayoutDtoMapper';

export class GetPageLayoutByRefHandler implements IQueryHandler<GetPageLayoutByRefQuery, PageLayoutDto | null> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(query: GetPageLayoutByRefQuery): Promise<PageLayoutDto | null> {
        const pageLayout = await this.repository.findByRef(
            parseEnum(query.pageType, PageType, 'page type'),
            new PageRef(query.pageRef),
        );
        return pageLayout ? toPageLayoutDto(pageLayout) : null;
    }
}
