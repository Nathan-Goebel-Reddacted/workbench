import { ErrorLogEntryId } from './valueObject/errorLogEntryId';
import { ErrorOrigin } from './valueObject/errorOrigin';
import { BoundedText } from './valueObject/boundedText';

export type ErrorContext = Readonly<Record<string, unknown>>;

/**
 * Une panne consignée, de quelque côté qu'elle soit survenue.
 *
 * Rien ici ne refuse : un journal qui rejette une entrée perd précisément ce qu'il existe
 * pour garder. Les textes trop longs sont tronqués par `BoundedText`, jamais écartés.
 */
export class ErrorLogEntry {
    constructor(
        private readonly id: ErrorLogEntryId,
        private readonly origin: ErrorOrigin,
        private readonly message: BoundedText,
        private readonly stack: BoundedText | null,
        private readonly url: BoundedText | null,
        private readonly userId: string | null,
        private readonly correlationId: string | null,
        private readonly context: ErrorContext,
        private readonly occurredAt: Date,
    ) {}

    getId(): ErrorLogEntryId {
        return this.id;
    }

    getOrigin(): ErrorOrigin {
        return this.origin;
    }

    getMessage(): BoundedText {
        return this.message;
    }

    getStack(): BoundedText | null {
        return this.stack;
    }

    getUrl(): BoundedText | null {
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
