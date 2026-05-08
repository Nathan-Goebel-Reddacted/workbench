import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'users' })
export class UserOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property()
    name!: string;

    @Property()
    surname!: string;

    @Property({ unique: true })
    email!: string;

    @Property({ type: 'json' })
    roles!: string[];
}
