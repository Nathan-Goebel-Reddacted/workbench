import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'cvs' })
export class CvOrmEntity {
    @PrimaryKey({ type: 'uuid' })
    id!: string;

    @Property({ type: 'text' })
    name!: string;

    @Property({ type: 'text' })
    fileUrl!: string;

    @Property({ type: 'boolean', default: true })
    visible!: boolean;

    @Index()
    @Property({ type: 'int' })
    displayOrder!: number;

    @Property({ type: 'timestamptz' })
    createdAt!: Date;
}
