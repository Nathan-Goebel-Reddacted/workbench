import { DomainException } from '@shared/domain/domainException';

export class InvalidReferenceException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidReferenceException';
        this.message = 'Ticket reference must follow the format <owner>.<feature>.<ticket> (e.g. 4.8.23)';
    }
}
