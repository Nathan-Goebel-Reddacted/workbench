import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

type LinkRow = { url: string; displayText: string; logo: string };

@Entity({ tableName: 'portfolios' })
export class PortfolioOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property({ type: 'uuid', unique: true })
    userId!: string;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'json' })
    languages!: string[];

    @Property({ type: 'json' })
    links!: LinkRow[];
}
