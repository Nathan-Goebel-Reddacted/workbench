export type ProjectDraft = Readonly<{
    id: string;
    /** Numéro repris de l'idée : c'est lui qui rend la conversion invisible aux références. */
    number: number;
    name: string;
    description: string;
    category: string;
    links: Array<{ url: string; displayText: string; logo: string }>;
    documents: Array<{ id: string; name: string; url: string; type: string }>;
}>;

/** Ce que le contexte Idea demande au ProjectCatalog : créer un projet à partir d'une idée. */
export interface IProjectCreationGateway {
    create(draft: ProjectDraft): Promise<void>;
}
