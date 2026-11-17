import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetPageByIdQuery } from './getPageByIdQuery';
import { PageDto } from '../pageDto';
import { IPageRepository } from '../../../domain/repository/iPageRepository';
import { PageId } from '../../../domain/valueObject/pageId';
import { PageReaders, toPageDto } from '../pageDtoMapper';

export class GetPageByIdHandler implements IQueryHandler<GetPageByIdQuery, PageDto | null> {
    constructor(
        private readonly repository: IPageRepository,
        private readonly readers: PageReaders,
    ) {}

    async handle(query: GetPageByIdQuery): Promise<PageDto | null> {
        const page = await this.repository.findById(new PageId(query.id));
        return page ? toPageDto(page, this.readers, 'editor') : null;
    }
}
