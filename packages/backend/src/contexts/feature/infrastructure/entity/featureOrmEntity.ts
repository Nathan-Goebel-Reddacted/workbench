import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';

type DocumentRow = { id: string; name: string; url: string; type: string };

@Entity({ tableName: 'features' })
// Le numéro d'une feature n'a de sens que dans son porteur : deux projets ont chacun leur n° 1.
// C'est cette contrainte qui rattrape deux créations concurrentes calculant le même numéro.
@Unique({ properties: ['ownerType', 'ownerId', 'number'] })
export class FeatureOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    /** `project` ou `idea` — pas de clé étrangère : les deux tables vivent dans d'autres contextes. */
    @Property({ type: 'varchar', length: 20 })
    ownerType!: string;

    @Property({ type: 'uuid' })
    @Index()
    ownerId!: string;

    @Property({ type: 'int' })
    number!: number;

    @Property()
    name!: string;

    @Property({ type: 'text' })
    description!: string;

    @Property({ type: 'json' })
    documents!: DocumentRow[];
}
