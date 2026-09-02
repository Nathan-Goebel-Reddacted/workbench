import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

type LinkRow = { url: string; displayText: string; logo: string };
type DocumentRow = { id: string; name: string; url: string; type: string };

@Entity({ tableName: 'ideas' })
export class IdeaOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    /** Même suite que les projets : une idée convertie garde son numéro. */
    @Property({ type: 'int', unique: true })
    number!: number;

    @Property({ type: 'text' })
    name!: string;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'timestamptz' })
    createdAt!: Date;

    @Property()
    category!: string;

    @Property({ type: 'json' })
    documents!: DocumentRow[];

    @Property({ type: 'json' })
    links!: LinkRow[];
}
