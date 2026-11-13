import { SiteAccess } from '../siteAccessAggregate';

export interface ISiteAccessRepository {
    /** Sans réglage enregistré, le site public est fermé. */
    get(): Promise<SiteAccess>;
    save(access: SiteAccess): Promise<void>;
}
