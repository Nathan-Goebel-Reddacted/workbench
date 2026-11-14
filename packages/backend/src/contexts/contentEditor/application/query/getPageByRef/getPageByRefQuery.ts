import { Query } from '@shared/application/query/query';

export class GetPageByRefQuery implements Query {
    static readonly queryName = 'contentEditor.GetPageByRef';
    readonly queryName: string;

    constructor(
        readonly pageType: string,
        readonly pageRef: string,
        readonly includeHidden: boolean = false,
    ) {
        this.queryName = GetPageByRefQuery.queryName;
    }
}
