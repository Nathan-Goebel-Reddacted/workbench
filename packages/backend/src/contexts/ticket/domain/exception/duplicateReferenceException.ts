import { DomainException } from '@shared/domain/domainException';

export class DuplicateReferenceException extends DomainException {
    constructor() {
        super('A ticket with this reference already exists');
    }
}
