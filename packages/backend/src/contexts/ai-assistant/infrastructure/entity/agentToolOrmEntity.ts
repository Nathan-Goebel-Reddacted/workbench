import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'agent_tools' })
export class AgentToolOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property({ type: 'uuid' })
    @Index()
    userId!: string;

    @Property()
    name!: string;

    @Property()
    permission!: string;

    @Property({ type: 'json' })
    scopes!: string[];

    @Property()
    token!: string;

    @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
    createdAt!: Date;

    /** Set while the agent is denied access. Null means active. */
    @Property({ type: 'timestamptz', nullable: true })
    revokedAt?: Date | null;
}
