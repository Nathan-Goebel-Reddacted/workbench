import { DomainException } from '@shared/domain/domainException';

export class InvalidEmailException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidEmailException';
        this.message = 'Email address is invalid';
    }
}
