import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'allowed_emails' })
export class AllowedEmailOrmEntity {
    @PrimaryKey()
    email!: string;

    @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
    createdAt!: Date;
}
