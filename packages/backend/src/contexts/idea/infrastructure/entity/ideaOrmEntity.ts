import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

type LinkRow = { url: string; displayText: string; logo: string };
type DocumentRow = { id: string; name: string; url: string; type: string };

@Entity({ tableName: 'ideas' })
export class IdeaOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'json' })
    documents!: DocumentRow[];

    @Property({ type: 'json' })
    links!: LinkRow[];
}
