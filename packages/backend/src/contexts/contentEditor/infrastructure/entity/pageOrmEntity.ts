import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

export type TransformRow = { x: number; y: number; w: number; h: number };

export type PlacementRow = { transform: TransformRow; hidden: boolean };

export type ElementRow = {
    id: string;
    layout: { desktop: PlacementRow; tablet: PlacementRow; mobile: PlacementRow; origin?: string };
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
