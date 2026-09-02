export type ResolvedOwnerDto = Readonly<{
    type: 'project' | 'idea';
    id: string;
    number: number;
    reference: string;
    name: string;
}>;

export type ResolvedFeatureDto = Readonly<{
    id: string;
    number: number;
    reference: string;
    name: string;
}>;

export type ResolvedTicketDto = Readonly<{
    id: string;
    number: number;
    reference: string;
    title: string;
    status: string;
}>;

/**
 * Ce que désigne une référence, avec toute sa chaîne de parents : on lit `4.8.23` quelque
 * part, on retrouve le ticket, sa feature et son porteur d'un seul appel.
 */
export type ResolvedReferenceDto = Readonly<{
    /** Le niveau réellement désigné par la référence fournie. */
    kind: 'owner' | 'feature' | 'ticket';
    owner: ResolvedOwnerDto;
    feature: ResolvedFeatureDto | null;
    ticket: ResolvedTicketDto | null;
}>;
