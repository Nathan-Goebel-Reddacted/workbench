import { Query } from './query';
import { IQueryHandler } from './iQueryHandler';

export class QueryBus {
    private readonly handlers = new Map<string, IQueryHandler<Query, unknown>>();

    register<Q extends Query, R>(queryName: string, handler: IQueryHandler<Q, R>): void {
        if (this.handlers.has(queryName)) {
            throw new Error(`Duplicate handler registered for: ${queryName}`);
        }
        this.handlers.set(queryName, handler as IQueryHandler<Query, unknown>);
    }

    async dispatch<Q extends Query, R>(query: Q): Promise<R> {
        const handler = this.handlers.get(query.queryName);
        if (!handler) throw new Error(`No handler registered for: ${query.queryName}`);
        return handler.handle(query) as Promise<R>;
    }
}
