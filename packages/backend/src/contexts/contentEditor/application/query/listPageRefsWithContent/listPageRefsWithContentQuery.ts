import { Query } from '@shared/application/query/query';

export class ListPageRefsWithContentQuery implements Query {
    static readonly queryName = 'contentEditor.ListPageRefsWithContent';
    readonly queryName: string;

    constructor(
        readonly pageType: string,
        readonly pageRefs: readonly string[],
    ) {
        this.queryName = ListPageRefsWithContentQuery.queryName;
    }
}
