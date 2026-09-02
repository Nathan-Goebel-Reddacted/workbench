import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

type SectionRow = {
    id: string;
    type: string;
    contentRef?: string | null;
    content?: Record<string, unknown>;
    x: number;
    y: number;
    w: number;
    h: number;
};

@Entity({ tableName: 'page_layouts' })
@Unique({ properties: ['pageType', 'pageRef'] })
export class PageLayoutOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property()
    pageType!: string;

    @Property({ type: 'uuid' })
    pageRef!: string;

    @Property({ type: 'json' })
    sections!: SectionRow[];
}
