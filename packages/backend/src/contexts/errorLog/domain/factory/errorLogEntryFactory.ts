import { ErrorLogEntry, ErrorContext } from '../errorLogEntryAggregate';
import { ErrorLogEntryId } from '../valueObject/errorLogEntryId';
import { ErrorOrigin } from '../valueObject/errorOrigin';
import { BoundedText, MAX_MESSAGE_LENGTH, MAX_STACK_LENGTH, MAX_URL_LENGTH } from '../valueObject/boundedText';

export type RecordedError = {
    id?: string;
    origin: ErrorOrigin;
    message: string;
    stack?: string | null;
    url?: string | null;
    userId?: string | null;
    correlationId?: string | null;
    context?: ErrorContext;
    occurredAt?: Date;
};

export class ErrorLogEntryFactory {
    record(input: RecordedError): ErrorLogEntry {
        return new ErrorLogEntry(
            new ErrorLogEntryId(input.id),
            input.origin,
            BoundedText.required(input.message, MAX_MESSAGE_LENGTH, 'Unknown error'),
            BoundedText.optional(input.stack, MAX_STACK_LENGTH),
            BoundedText.optional(input.url, MAX_URL_LENGTH),
            input.userId ?? null,
            input.correlationId ?? null,
            input.context ?? {},
            input.occurredAt ?? new Date(),
        );
    }

    rehydrate(input: {
        id: string;
        origin: ErrorOrigin;
        message: string;
        stack: string | null;
        url: string | null;
        userId: string | null;
        correlationId: string | null;
        context: ErrorContext;
        occurredAt: Date;
    }): ErrorLogEntry {
        return new ErrorLogEntry(
            new ErrorLogEntryId(input.id),
            input.origin,
            BoundedText.required(input.message, MAX_MESSAGE_LENGTH, 'Unknown error'),
            BoundedText.optional(input.stack, MAX_STACK_LENGTH),
            BoundedText.optional(input.url, MAX_URL_LENGTH),
            input.userId,
            input.correlationId,
            input.context,
            input.occurredAt,
        );
    }
}
