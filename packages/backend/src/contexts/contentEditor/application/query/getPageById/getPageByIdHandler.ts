import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetPageByIdQuery } from './getPageByIdQuery';
import { PageDto } from '../pageDto';
import { IPageRepository } from '../../../domain/repository/iPageRepository';
import { PageId } from '../../../domain/valueObject/pageId';
import { toPageDto } from '../pageDtoMapper';
import { IProjectDestinations } from '../../../domain/port/iProjectDestinations';

export class GetPageByIdHandler implements IQueryHandler<GetPageByIdQuery, PageDto | null> {
    constructor(
        private readonly repository: IPageRepository,
        private readonly destinations: IProjectDestinations,
    ) {}

    async handle(query: GetPageByIdQuery): Promise<PageDto | null> {
        const page = await this.repository.findById(new PageId(query.id));
        return page ? toPageDto(page, this.destinations) : null;
    }
}
