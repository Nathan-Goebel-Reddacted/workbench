import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { PairingStatusValue } from '../../domain/valueObject/pairingStatus';

@Entity({ tableName: 'agent_pairing_requests' })
export class AgentPairingRequestOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    /** Name the agent declares for itself. Untrusted: shown for recognition only. */
    @Property()
    name!: string;

    @Property({ type: 'json', default: '[]' })
    requestedScopes!: string[];

    @Property()
    requestedPermission!: string;

    /** bcrypt hash of the pairing code shown to the agent. */
    @Property()
    codeHash!: string;

    /**
     * First characters of the pairing code, in clear. Displayed in the admin screen so the
     * pending request can be matched against the code the agent printed, and used to look the
     * row up on claim. Too short on its own to be worth guessing.
     */
    @Property()
    @Index()
    codePrefix!: string;

    @Property({ type: 'varchar', default: 'pending' })
    @Index()
    status!: PairingStatusValue;

    /** Set once approved: the agent this request grants access to. */
    @Property({ type: 'uuid', nullable: true })
    agentToolId?: string;

    @Property({ type: 'timestamptz' })
    expiresAt!: Date;

    @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
    createdAt!: Date;
}
