import { AccessRequest } from '../accessRequestAggregate';
import { AccessRequestStatus } from '../valueObject/accessRequestStatus';
import { AuthEmail } from '../valueObject/email';

export interface IAccessRequestRepository {
    findByEmail(email: AuthEmail): Promise<AccessRequest | null>;
    /** Les demandes, la plus récente d'abord — c'est l'ordre de l'écran d'administration. */
    findAll(status?: AccessRequestStatus): Promise<AccessRequest[]>;
    save(request: AccessRequest): Promise<void>;
}
