import { Query } from '@shared/application/query/query';
import { ErrorOrigin } from '@contexts/errorLog/domain/valueObject/errorOrigin';

export class SearchErrorLogQuery implements Query {
    static readonly queryName = 'errorLog.SearchErrorLog';
    readonly queryName = SearchErrorLogQuery.queryName;

    constructor(
        readonly criteria: {
            origin?: ErrorOrigin;
            from?: Date;
            to?: Date;
            query?: string;
            limit: number;
            offset: number;
        },
    ) {}
}
