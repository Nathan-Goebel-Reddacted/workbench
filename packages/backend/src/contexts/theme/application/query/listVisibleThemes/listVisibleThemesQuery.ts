import { Query } from '@shared/application/query/query';

export class ListVisibleThemesQuery implements Query {
    static readonly queryName = 'theme.ListVisibleThemes';
    readonly queryName = ListVisibleThemesQuery.queryName;
}
