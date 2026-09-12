/**
 * Ce que l'éditeur de contenu a le droit de savoir des médias déjà attachés ailleurs, et rien
 * de plus.
 *
 * Il ne lit ni les projets, ni les features, ni les tickets : il demande une arborescence de
 * médias, et ceux qui les détiennent répondent. Aucun agrégat étranger ne franchit ce port —
 * c'est précisément ce qui le distingue de l'accès direct aux dépôts voisins qu'il remplace.
 */

/** Le type de média voulu. Le sens de chacun appartient au contexte qui détient les documents. */
export type MediaKind = 'image' | 'video' | 'mindmap' | 'document';

export type MediaItem = Readonly<{
    id: string;
    name: string;
    url: string;
}>;

export type TicketMedia = Readonly<{
    ticketId: string;
    reference: string;
    title: string;
    images: MediaItem[];
}>;

export type FeatureMedia = Readonly<{
    featureId: string;
    featureName: string;
    images: MediaItem[];
    tickets: TicketMedia[];
}>;

export type ProjectMedia = Readonly<{
    projectId: string;
    projectName: string;
    images: MediaItem[];
    features: FeatureMedia[];
}>;

export interface IMediaLibrary {
    /**
     * L'arborescence porteur → feature → ticket, ne gardant que les branches qui portent au
     * moins un média du type demandé. Un projet sans média nulle part n'y figure pas.
     */
    browse(kind: MediaKind): Promise<ProjectMedia[]>;
}
