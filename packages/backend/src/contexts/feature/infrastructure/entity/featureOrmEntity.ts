import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

type DocumentRow = { id: string; name: string; url: string; type: string };

@Entity({ tableName: 'features' })
export class FeatureOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property({ type: 'uuid' })
    @Index()
    projectId!: string;

    @Property()
    name!: string;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'json' })
    documents!: DocumentRow[];
}
