import { IQueryHandler } from '@shared/application/query/iQueryHandler';
import { SearchErrorLogQuery } from './searchErrorLogQuery';
import { ErrorLogEntryDto, ErrorLogPageDto } from './errorLogEntryDto';
import { IErrorLogRepository } from '../../../domain/repository/iErrorLogRepository';
import { ErrorLogEntry } from '../../../domain/errorLogEntryAggregate';

export class SearchErrorLogHandler implements IQueryHandler<SearchErrorLogQuery, ErrorLogPageDto> {
    constructor(private readonly repository: IErrorLogRepository) {}

    async handle(query: SearchErrorLogQuery): Promise<ErrorLogPageDto> {
        const page = await this.repository.search(query.criteria);
        return {
            entries: page.entries.map(entry => toDto(entry)),
            total: page.total,
            limit: query.criteria.limit,
            offset: query.criteria.offset,
        };
    }
}

function toDto(entry: ErrorLogEntry): ErrorLogEntryDto {
    return {
        id: entry.getId().getValue(),
        origin: entry.getOrigin(),
        message: entry.getMessage().getValue(),
        stack: entry.getStack()?.getValue() ?? null,
        url: entry.getUrl()?.getValue() ?? null,
        userId: entry.getUserId(),
        correlationId: entry.getCorrelationId(),
        context: entry.getContext(),
        occurredAt: entry.getOccurredAt().toISOString(),
    };
}
