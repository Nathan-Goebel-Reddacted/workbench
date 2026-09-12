import { Command } from '@shared/application/command/command';
import { ErrorContext } from '@contexts/errorLog/domain/errorLogEntryAggregate';
import { ErrorOrigin } from '@contexts/errorLog/domain/valueObject/errorOrigin';

export class RecordErrorLogEntryCommand implements Command {
    static readonly commandName = 'errorLog.RecordErrorLogEntry';
    readonly commandName = RecordErrorLogEntryCommand.commandName;

    constructor(
        readonly origin: ErrorOrigin,
        readonly message: string,
        readonly details: {
            stack?: string | null;
            url?: string | null;
            userId?: string | null;
            correlationId?: string | null;
            context?: ErrorContext;
            occurredAt?: Date;
        } = {},
    ) {}
}
