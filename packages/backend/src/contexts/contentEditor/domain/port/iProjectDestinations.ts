export type LinkDestination =
    | Readonly<{ kind: 'page'; projectId: string }>
    | Readonly<{ kind: 'external'; url: string }>
    | Readonly<{ kind: 'none' }>;

/**
 * Où mène un lien vers un projet : sa page, son lien de remplacement, ou nulle part quand il
 * est masqué, inconnu ou sans page. Le projet en décide ; l'éditeur ne fait que demander.
 */
export interface IProjectDestinations {
    destinationsOf(projectIds: readonly string[]): Promise<ReadonlyMap<string, LinkDestination>>;
}
