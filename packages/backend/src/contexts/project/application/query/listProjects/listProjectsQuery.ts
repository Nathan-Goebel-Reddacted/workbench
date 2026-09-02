import { Query } from '@shared/application/query/query';

export class ListProjectsQuery implements Query {
    static readonly queryName = 'project.ListProjects';
    readonly queryName = ListProjectsQuery.queryName;

    // Les projets non visibles ne quittent le serveur que pour un appelant de la partie
    // privée : le drapeau `visible` est une règle d'exposition, pas un filtre d'affichage.
    constructor(readonly includeHidden: boolean = false) {}
}
