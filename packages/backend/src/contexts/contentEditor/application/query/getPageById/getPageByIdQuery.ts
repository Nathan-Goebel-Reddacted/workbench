import { Query } from '@shared/application/query/query';

export class GetPageByIdQuery implements Query {
    static readonly queryName = 'contentEditor.GetPageById';
    readonly queryName: string;

    constructor(readonly id: string) {
        this.queryName = GetPageByIdQuery.queryName;
    }
}
