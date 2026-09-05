export type ErrorOrigin = 'front' | 'back';

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_STACK_LENGTH = 8000;
export const MAX_URL_LENGTH = 500;

export type ErrorContext = Readonly<Record<string, unknown>>;

function truncate(value: string, max: number): string {
    return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function truncateOptional(value: string | null | undefined, max: number): string | null {
    const trimmed = value?.trim();
    return trimmed ? truncate(trimmed, max) : null;
}

/**
 * One recorded failure, whichever side it happened on. Nothing here rejects: a journal that
 * refuses an entry loses the very thing it exists to keep, so oversized input is truncated.
 */
export class ErrorLogEntry {
    private constructor(
        private readonly id: string,
        private readonly origin: ErrorOrigin,
        private readonly message: string,
        private readonly stack: string | null,
        private readonly url: string | null,
        private readonly userId: string | null,
        private readonly correlationId: string | null,
        private readonly context: ErrorContext,
        private readonly occurredAt: Date,
    ) {}

    static record(input: {
        id: string;
        origin: ErrorOrigin;
        message: string;
        stack?: string | null;
        url?: string | null;
        userId?: string | null;
        correlationId?: string | null;
        context?: ErrorContext;
        occurredAt: Date;
    }): ErrorLogEntry {
        return new ErrorLogEntry(
            input.id,
            input.origin,
            truncate(input.message.trim() || 'Unknown error', MAX_MESSAGE_LENGTH),
            truncateOptional(input.stack, MAX_STACK_LENGTH),
            truncateOptional(input.url, MAX_URL_LENGTH),
            input.userId ?? null,
            input.correlationId ?? null,
            input.context ?? {},
            input.occurredAt,
        );
    }

    getId(): string {
        return this.id;
    }

    getOrigin(): ErrorOrigin {
        return this.origin;
    }

    getMessage(): string {
        return this.message;
    }

    getStack(): string | null {
        return this.stack;
    }

    getUrl(): string | null {
        return this.url;
    }

    getUserId(): string | null {
        return this.userId;
    }

    getCorrelationId(): string | null {
        return this.correlationId;
    }

    getContext(): ErrorContext {
        return this.context;
    }

    getOccurredAt(): Date {
        return this.occurredAt;
    }
}
