import { Query } from '@shared/application/query/query';

export class ListThemesQuery implements Query {
    static readonly queryName = 'theme.ListThemes';
    readonly queryName = ListThemesQuery.queryName;
}
