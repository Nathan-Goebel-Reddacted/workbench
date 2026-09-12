import { DomainException } from '@shared/domain/domainException';

export class InvalidSenderEmailException extends DomainException {
    constructor() {
        super('The sender email is not a valid address');
    }
}
