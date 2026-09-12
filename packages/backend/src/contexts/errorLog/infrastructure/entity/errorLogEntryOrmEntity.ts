import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { ErrorContext } from '../../domain/errorLogEntryAggregate';
import { ErrorOrigin } from '../../domain/valueObject/errorOrigin';

@Entity({ tableName: 'error_log_entries' })
export class ErrorLogEntryOrmEntity {
    @PrimaryKey()
    id!: string;

    /** Kept as a varchar rather than a PG enum: a third origin must not cost a migration. */
    @Property({ type: 'varchar', length: 16 })
    origin!: ErrorOrigin;

    @Property({ type: 'text' })
    message!: string;

    @Property({ type: 'text', nullable: true })
    stack!: string | null;

    @Property({ type: 'varchar', length: 500, nullable: true })
    url!: string | null;

    @Property({ type: 'varchar', nullable: true })
    userId!: string | null;

    @Property({ type: 'varchar', nullable: true })
    correlationId!: string | null;

    @Property({ type: 'json' })
    context!: ErrorContext;

    @Index()
    @Property({ type: 'timestamptz' })
    occurredAt!: Date;
}
