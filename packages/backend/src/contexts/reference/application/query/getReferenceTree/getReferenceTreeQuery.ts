import { Query } from '@shared/application/query/query';

export class GetReferenceTreeQuery implements Query {
    static readonly queryName = 'reference.GetReferenceTree';
    readonly queryName: string;

    constructor() {
        this.queryName = GetReferenceTreeQuery.queryName;
    }
}
