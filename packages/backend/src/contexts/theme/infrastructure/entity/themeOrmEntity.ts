import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'themes' })
export class ThemeOrmEntity {
    @PrimaryKey()
    id!: string;

    @Property()
    name!: string;

    /** La palette : noms de variables CSS vers valeurs. Ouverte, d'où le jsonb. */
    @Property({ type: 'jsonb' })
    colors!: Record<string, string>;

    @Property()
    visible!: boolean;

    /**
     * Un seul thème peut le porter — une contrainte unique partielle le garantit en base
     * (cf. la migration). Sans elle, deux écritures concurrentes produiraient deux défauts
     * et le site public en choisirait un au hasard.
     */
    @Property()
    @Index()
    isDefault!: boolean;

    @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
    createdAt!: Date;
}
