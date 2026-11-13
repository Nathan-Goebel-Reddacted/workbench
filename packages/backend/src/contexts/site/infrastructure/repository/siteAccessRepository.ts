import { EntityManager } from '@mikro-orm/postgresql';
import { ISiteAccessRepository } from '../../domain/repository/iSiteAccessRepository';
import { SiteAccess } from '../../domain/siteAccessAggregate';
import { SITE_ACCESS_ID, SiteAccessOrmEntity } from '../entity/siteAccessOrmEntity';

export class SiteAccessRepository implements ISiteAccessRepository {
    constructor(private readonly em: EntityManager) {}

    async get(): Promise<SiteAccess> {
        const e = await this.em.findOne(SiteAccessOrmEntity, { id: SITE_ACCESS_ID });
        return e ? new SiteAccess(e.open) : SiteAccess.closed();
    }

    async save(access: SiteAccess): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(SiteAccessOrmEntity, { id: SITE_ACCESS_ID, open: access.isOpen() });
        });
    }
}
