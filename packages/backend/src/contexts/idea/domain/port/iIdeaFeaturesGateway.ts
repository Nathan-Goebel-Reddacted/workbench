/**
 * Ce que le contexte Idea demande au contexte Feature. Une idée ne connaît pas ses features : elle
 * annonce sa disparition, et Feature enchaîne sur ses propres tickets.
 */
export interface IIdeaFeaturesGateway {
    /** Nombre de features et de tickets portés — pour annoncer ce qu'une suppression emporterait. */
    countOf(ideaId: string): Promise<{ features: number; tickets: number }>;

    /**
     * Supprime les features de cette idée, et par cascade leurs tickets.
     * Rend les URLs emportées par la cascade, pour que leurs fichiers puissent être libérés.
     */
    deleteAllOf(ideaId: string): Promise<string[]>;

    /** Rattache les features de l'idée à un projet — c'est le cœur de la conversion. */
    transferToProject(ideaId: string, projectId: string): Promise<void>;
}
