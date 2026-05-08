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
}
