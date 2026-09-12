import { DomainException } from '@shared/domain/domainException';

export class PairingRequestNotApprovedException extends DomainException {
    constructor() {
        super('Pairing request has not been approved');
    }
}
