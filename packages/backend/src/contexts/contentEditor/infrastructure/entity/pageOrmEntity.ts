import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

export type ElementRow = {
    id: string;
    transform: { x: number; y: number; w: number; h: number };
    components: Record<string, unknown>;
};

@Entity({ tableName: 'pages' })
@Unique({ properties: ['pageType', 'pageRef'] })
export class PageOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property()
    pageType!: string;

    @Property({ type: 'uuid' })
    pageRef!: string;

    @Property({ type: 'json' })
    elements!: ElementRow[];

    @Property({ type: 'integer' })
    version!: number;
}
