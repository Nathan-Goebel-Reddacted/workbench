export type LinkDestination =
    | Readonly<{ kind: 'page'; projectId: string }>
    | Readonly<{ kind: 'external'; url: string }>
    | Readonly<{ kind: 'none' }>;

export type ProjectSummary = Readonly<{
    visible: boolean;
    destination: LinkDestination;
}>;

/**
 * Ce qu'une Page sait d'un projet qu'elle cite : s'il est visible et où il mène. Le projet en
 * décide ; l'éditeur ne fait que demander, en une fois pour toute la Page. Un projet inconnu
 * est absent de la réponse.
 */
export interface IProjectReferences {
    summariesOf(projectIds: readonly string[]): Promise<ReadonlyMap<string, ProjectSummary>>;
}
