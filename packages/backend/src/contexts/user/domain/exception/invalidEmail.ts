import { DomainException } from '@shared/domain/domainException';

export class InvalidEmailException extends DomainException {
    constructor() {
        super('Email address is invalid');
    }
}
