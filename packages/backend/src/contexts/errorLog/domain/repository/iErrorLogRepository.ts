import { ErrorLogEntry } from '../errorLogEntryAggregate';
import { ErrorOrigin } from '../valueObject/errorOrigin';

export type ErrorLogSearch = Readonly<{
    origin?: ErrorOrigin;
    from?: Date;
    to?: Date;
    query?: string;
    limit: number;
    offset: number;
}>;

export type ErrorLogPage = Readonly<{
    entries: ErrorLogEntry[];
    total: number;
}>;

export interface IErrorLogRepository {
    record(entry: ErrorLogEntry): Promise<void>;
    search(criteria: ErrorLogSearch): Promise<ErrorLogPage>;
    /** Deletes everything, or everything strictly older than `before`. Returns the row count. */
    purge(before?: Date): Promise<number>;
    /** Drops the oldest rows beyond `max`, so the table stays bounded without supervision. */
    trim(max: number): Promise<number>;
}
