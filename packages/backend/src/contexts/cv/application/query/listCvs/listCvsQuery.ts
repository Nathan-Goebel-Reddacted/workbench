import { Query } from '@shared/application/query/query';

export class ListCvsQuery implements Query {
    static readonly queryName = 'cv.ListCvs';
    readonly queryName = ListCvsQuery.queryName;

    // Même règle que pour les projets : `visible` s'applique au serveur, pas au navigateur.
    constructor(readonly includeHidden: boolean = false) {}
}
