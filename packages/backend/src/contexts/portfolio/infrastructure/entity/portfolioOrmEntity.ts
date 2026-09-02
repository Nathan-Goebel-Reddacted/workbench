import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'portfolios' })
export class PortfolioOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property({ type: 'json' })
    languages!: string[];
}
