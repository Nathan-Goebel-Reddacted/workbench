import { PairingRequest } from '../pairingRequestAggregate';

export interface IPairingRequestRepository {
    findById(id: string): Promise<PairingRequest | null>;

    /** Les candidates que le préfixe désigne : c'est l'empreinte, ensuite, qui tranche. */
    findByCodePrefix(prefix: string): Promise<PairingRequest[]>;

    /** Les demandes encore vivantes — en attente ou approuvées —, la plus récente en tête. */
    findOpen(): Promise<PairingRequest[]>;

    countPending(): Promise<number>;

    deleteExpired(): Promise<void>;

    save(request: PairingRequest): Promise<void>;
}
