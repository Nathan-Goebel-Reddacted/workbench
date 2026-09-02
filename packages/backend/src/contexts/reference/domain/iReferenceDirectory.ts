export type OwnerRow = Readonly<{ type: 'project' | 'idea'; id: string; number: number; name: string }>;
export type FeatureRow = Readonly<{ id: string; number: number; name: string }>;
export type TicketRow = Readonly<{ id: string; number: number; reference: string; title: string; status: string }>;

/**
 * Vue en lecture seule sur la hiérarchie porteur → feature → ticket. Le contexte Reference ne
 * possède aucune donnée : il ne fait que traduire des numéros en entités, en demandant à chaque
 * contexte ce qu'il détient.
 */
export interface IReferenceDirectory {
    listOwners(): Promise<OwnerRow[]>;
    findOwnerByNumber(number: number): Promise<OwnerRow | null>;
    listFeaturesOf(owner: OwnerRow): Promise<FeatureRow[]>;
    listTicketsOf(featureId: string): Promise<TicketRow[]>;
}
