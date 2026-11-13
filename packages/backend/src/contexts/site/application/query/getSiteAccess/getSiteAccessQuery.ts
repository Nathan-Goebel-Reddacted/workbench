import { Query } from '@shared/application/query/query';

export class GetSiteAccessQuery implements Query {
    static readonly queryName = 'site.GetSiteAccess';
    readonly queryName = GetSiteAccessQuery.queryName;
}
