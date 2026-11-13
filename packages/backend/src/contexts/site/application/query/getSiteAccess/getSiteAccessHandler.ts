import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { GetSiteAccessQuery } from './getSiteAccessQuery';
import { SiteAccessDto } from './siteAccessDto';
import { ISiteAccessRepository } from '../../../domain/repository/iSiteAccessRepository';

export class GetSiteAccessHandler implements IQueryHandler<GetSiteAccessQuery, SiteAccessDto> {
    constructor(private readonly repository: ISiteAccessRepository) {}

    async handle(_query: GetSiteAccessQuery): Promise<SiteAccessDto> {
        const access = await this.repository.get();
        return { open: access.isOpen() };
    }
}
