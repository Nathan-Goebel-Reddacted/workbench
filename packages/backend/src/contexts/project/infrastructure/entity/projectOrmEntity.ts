import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

type LinkRow = { url: string; displayText: string; logo: string };
type DocumentRow = { id: string; name: string; url: string; type: string };

@Entity({ tableName: 'projects' })
export class ProjectOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    /** Premier segment des références de tickets. Unique parmi les porteurs (projets et idées). */
    @Property({ type: 'int', unique: true })
    number!: number;

    @Property({ type: 'varchar', length: 255 })
    name!: string;

    @Property({ type: 'text' })
    description!: string;

    // Un projet naît privé : la publication est un geste explicite, jamais l'état initial.
    @Property({ type: 'boolean', default: false })
    visible!: boolean;

    @Property({ type: 'varchar', length: 50, default: 'personal' })
    category!: string;

    @Property({ type: 'json' })
    documents!: DocumentRow[];

    @Property({ type: 'json' })
    links!: LinkRow[];
}
