/**
 * Le cycle d'une demande d'appairage. `claimed` et `rejected` sont terminaux : une demande
 * réclamée a déjà livré son secret, et une demande refusée ne doit pas pouvoir renaître.
 */
export enum PairingStatusValue {
    PENDING = 'pending',
    APPROVED = 'approved',
    CLAIMED = 'claimed',
    REJECTED = 'rejected',
}
