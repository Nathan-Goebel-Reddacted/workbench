import { Query } from '@shared/application/query/query';

export class ResolveReferenceQuery implements Query {
    static readonly queryName = 'reference.ResolveReference';
    readonly queryName: string;

    /** `4`, `4.8` ou `4.8.23` — les trois profondeurs sont acceptées. */
    constructor(readonly reference: string) {
        this.queryName = ResolveReferenceQuery.queryName;
    }
}
