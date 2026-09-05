import { EntityManager } from '@mikro-orm/postgresql';
import { FilterQuery } from '@mikro-orm/core';
import { IErrorLogRepository, ErrorLogPage, ErrorLogSearch } from '../../domain/repository/iErrorLogRepository';
import { ErrorLogEntry } from '../../domain/errorLogEntryAggregate';
import { ErrorLogEntryOrmEntity } from '../entity/errorLogEntryOrmEntity';

export class ErrorLogRepository implements IErrorLogRepository {
    constructor(private readonly em: EntityManager) {}

    /**
     * Forked on purpose: the caller may be the error handler of a request whose own unit of
     * work just failed, and the journal must not ride on a unit of work that is rolling back.
     */
    async record(entry: ErrorLogEntry): Promise<void> {
        const em = this.em.fork();
        await em.transactional(async scoped => {
            await scoped.upsert(ErrorLogEntryOrmEntity, this.toOrm(entry));
        });
    }

    async search(criteria: ErrorLogSearch): Promise<ErrorLogPage> {
        const where: FilterQuery<ErrorLogEntryOrmEntity> = {};
        if (criteria.origin) where.origin = criteria.origin;
        if (criteria.from || criteria.to) {
            where.occurredAt = {
                ...(criteria.from ? { $gte: criteria.from } : {}),
                ...(criteria.to ? { $lte: criteria.to } : {}),
            };
        }
        if (criteria.query) {
            const pattern = `%${criteria.query}%`;
            where.$or = [{ message: { $ilike: pattern } }, { url: { $ilike: pattern } }];
        }

        const [rows, total] = await this.em.findAndCount(ErrorLogEntryOrmEntity, where, {
            orderBy: { occurredAt: 'desc' },
            limit: criteria.limit,
            offset: criteria.offset,
        });

        return { entries: rows.map(row => this.toDomain(row)), total };
    }

    async purge(before?: Date): Promise<number> {
        const where = before ? { occurredAt: { $lt: before } } : {};
        return this.em.nativeDelete(ErrorLogEntryOrmEntity, where);
    }

    async trim(max: number): Promise<number> {
        const result = await this.em.getConnection().execute<{ id: string }[]>(
            `delete from "error_log_entries" where "id" in (
                 select "id" from "error_log_entries" order by "occurred_at" desc offset ?
             ) returning "id"`,
            [max],
        );
        return result.length;
    }

    private toOrm(entry: ErrorLogEntry): ErrorLogEntryOrmEntity {
        const e = new ErrorLogEntryOrmEntity();
        e.id = entry.getId();
        e.origin = entry.getOrigin();
        e.message = entry.getMessage();
        e.stack = entry.getStack();
        e.url = entry.getUrl();
        e.userId = entry.getUserId();
        e.correlationId = entry.getCorrelationId();
        e.context = entry.getContext();
        e.occurredAt = entry.getOccurredAt();
        return e;
    }

    private toDomain(row: ErrorLogEntryOrmEntity): ErrorLogEntry {
        return ErrorLogEntry.record({
            id: row.id,
            origin: row.origin,
            message: row.message,
            stack: row.stack,
            url: row.url,
            userId: row.userId,
            correlationId: row.correlationId,
            context: row.context,
            occurredAt: row.occurredAt,
        });
    }
}
