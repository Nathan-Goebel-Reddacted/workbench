import { DomainException } from '@shared/domain/domainException';

export class PairingRequestAlreadyDecidedException extends DomainException {
    constructor(status: string) {
        super(`Request is already ${status}`);
    }
}
