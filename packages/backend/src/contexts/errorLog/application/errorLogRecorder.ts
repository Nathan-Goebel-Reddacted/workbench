import { randomUUID } from 'crypto';
import { ErrorContext, ErrorLogEntry, ErrorOrigin } from '../domain/errorLogEntryAggregate';
import { IErrorLogRepository } from '../domain/repository/iErrorLogRepository';

export const DEFAULT_MAX_ROWS = 5000;
const TRIM_EVERY = 50;

export type RecordedError = {
    origin: ErrorOrigin;
    message: string;
    stack?: string | null;
    url?: string | null;
    userId?: string | null;
    correlationId?: string | null;
    context?: ErrorContext;
    occurredAt?: Date;
};

/**
 * Single write path into the journal. The row cap is applied every few writes rather than on
 * each one: the table stays bounded and the delete does not ride along with every failure.
 */
export class ErrorLogRecorder {
    private writesSinceTrim = 0;

    constructor(
        private readonly repository: IErrorLogRepository,
        private readonly maxRows: number = DEFAULT_MAX_ROWS,
    ) {}

    async record(input: RecordedError): Promise<void> {
        await this.repository.record(
            ErrorLogEntry.record({
                id: randomUUID(),
                origin: input.origin,
                message: input.message,
                stack: input.stack,
                url: input.url,
                userId: input.userId,
                correlationId: input.correlationId,
                context: input.context,
                occurredAt: input.occurredAt ?? new Date(),
            }),
        );

        if (++this.writesSinceTrim >= TRIM_EVERY) {
            this.writesSinceTrim = 0;
            await this.repository.trim(this.maxRows);
        }
    }
}
