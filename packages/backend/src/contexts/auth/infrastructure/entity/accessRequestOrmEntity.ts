import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

@Entity({ tableName: 'access_requests' })
export class AccessRequestOrmEntity {
    /** The email is the identity: it was verified by the OAuth provider before we ever saw it. */
    @PrimaryKey()
    email!: string;

    @Property()
    displayName!: string;

    @Property({ type: 'varchar', default: 'pending' })
    @Index()
    status!: AccessRequestStatus;

    @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
    createdAt!: Date;

    @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
    updatedAt!: Date;
}
