import { DomainException } from '../domainException';

export class NotNullOrEmptyException extends DomainException {
    constructor() {
        super('Value cannot be null or empty');
    }
}
