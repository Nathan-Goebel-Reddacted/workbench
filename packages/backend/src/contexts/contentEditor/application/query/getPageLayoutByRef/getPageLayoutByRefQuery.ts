import { Query } from '@shared/application/query/query';

export class GetPageLayoutByRefQuery implements Query {
    static readonly queryName = 'contentEditor.GetPageLayoutByRef';
    readonly queryName: string;

    constructor(
        readonly pageType: string,
        readonly pageRef: string,
        readonly includeHidden: boolean = false,
    ) {
        this.queryName = GetPageLayoutByRefQuery.queryName;
    }
}
