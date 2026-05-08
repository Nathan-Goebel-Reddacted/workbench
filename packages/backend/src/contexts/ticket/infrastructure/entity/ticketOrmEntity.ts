import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

type DocumentRow = { id: string; name: string; url: string; type: string };

@Entity({ tableName: 'tickets' })
export class TicketOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property({ unique: true })
    reference!: string;

    @Property({ type: 'uuid' })
    @Index()
    featureId!: string;

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
