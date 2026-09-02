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

    // Incrémenté à chaque révocation : un jeton signé avec une version antérieure est
    // refusé, ce qui rend un vol de cookie annulable sans attendre l'expiration.
    @Property({ default: 0 })
    tokenVersion: number = 0;
}
