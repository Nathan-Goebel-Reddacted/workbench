import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetPageLayoutByIdQuery } from './getPageLayoutByIdQuery';
import { PageLayoutDto } from './pageLayoutDto';
import { IPageLayoutRepository } from '../../../domain/repository/iPageLayoutRepository';
import { PageLayoutId } from '../../../domain/valueObject/pageLayoutId';
import { toPageLayoutDto } from '../pageLayoutDtoMapper';

export class GetPageLayoutByIdHandler implements IQueryHandler<GetPageLayoutByIdQuery, PageLayoutDto | null> {
    constructor(private readonly repository: IPageLayoutRepository) {}

    async handle(query: GetPageLayoutByIdQuery): Promise<PageLayoutDto | null> {
        const pageLayout = await this.repository.findById(new PageLayoutId(query.id));
        return pageLayout ? toPageLayoutDto(pageLayout) : null;
    }
}
