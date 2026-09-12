import { DomainException } from '@shared/domain/domainException';

export class EmptyContactMessageException extends DomainException {
    constructor() {
        super('A contact message cannot be empty');
    }
}
