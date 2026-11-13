import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

export const SITE_ACCESS_ID = 'public-site';

@Entity({ tableName: 'site_access' })
export class SiteAccessOrmEntity {
    @PrimaryKey({ type: 'text' })
    id!: string;

    @Property({ type: 'boolean' })
    open!: boolean;
}
