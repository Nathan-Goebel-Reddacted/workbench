import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';

type DocumentRow = { id: string; name: string; url: string; type: string };

@Entity({ tableName: 'tickets' })
// Le numéro d'un ticket est relatif à sa feature : chaque feature a son numéro 1. Cette contrainte
// est ce qui rattrape deux créations concurrentes ayant lu le même dernier numéro.
@Unique({ properties: ['featureId', 'number'] })
export class TicketOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    /** Référence complète `4.8.23`, unique dans tout le système. */
    @Property({ unique: true })
    reference!: string;

    @Property({ type: 'uuid' })
    @Index()
    featureId!: string;

    /** Troisième segment de la référence, isolé pour porter la contrainte d'unicité. */
    @Property({ type: 'int' })
    number!: number;

    @Property()
    title!: string;

    @Property({ type: 'text' })
    description!: string;

    @Property()
    status!: string;

    @Property({ type: 'json' })
    notes!: string[];

    @Property({ type: 'json' })
    documents!: DocumentRow[];
}
