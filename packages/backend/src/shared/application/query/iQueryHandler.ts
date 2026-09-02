import { Query } from './query';

export interface IQueryHandler<Q extends Query, R> {
    handle(query: Q): Promise<R>;
}
