export type FeatureDto = Readonly<{
    id: string;
    ownerType: string;
    ownerId: string;
    /** Numéro dans son porteur : `8` pour la 8e feature du projet. */
    number: number;
    /** Identifiant lisible complet : `4.8`. Vide si le porteur a disparu. */
    reference: string;
    name: string;
    description: string;
    documents: Array<{ id: string; name: string; url: string; type: string }>;
}>;
