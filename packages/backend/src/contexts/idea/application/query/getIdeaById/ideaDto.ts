export type IdeaDto = Readonly<{
    id: string;
    /** Numéro de porteur, conservé si l'idée devient un projet. */
    number: number;
    /** Identifiant lisible : `4`. */
    reference: string;
    name: string;
    description: string;
    createdAt: string;
    category: string;
    links: Array<{ url: string; displayText: string; logo: string }>;
    documents: Array<{ id: string; name: string; url: string; type: string }>;
}>;
