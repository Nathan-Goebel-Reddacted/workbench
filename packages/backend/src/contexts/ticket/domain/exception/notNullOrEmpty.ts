import { DomainException } from '@shared/domain/domainException';

export class NotNullOrEmptyException extends DomainException {
    constructor() {
        super();
        this.name = 'NotNullOrEmptyException';
        this.message = 'Value cannot be null or empty';
    }
}
