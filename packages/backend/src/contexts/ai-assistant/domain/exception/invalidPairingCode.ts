import { DomainException } from '@shared/domain/domainException';

export class InvalidPairingCodeException extends DomainException {
    constructor() {
        super('Pairing code cannot be empty');
    }
}
