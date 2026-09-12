import { AccessRequest } from '../accessRequestAggregate';
import { AuthEmail } from '../valueObject/email';

export interface IAccessRequestRepository {
    findByEmail(email: AuthEmail): Promise<AccessRequest | null>;
    /** Les demandes, la plus récente d'abord — c'est l'ordre de l'écran d'administration. */
    findAll(): Promise<AccessRequest[]>;
    save(request: AccessRequest): Promise<void>;
}
