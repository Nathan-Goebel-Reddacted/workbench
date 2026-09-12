import { DomainException } from '../domainException';

export class InvalidDocumentUrlException extends DomainException {
    constructor() {
        super('Document URL cannot be empty');
    }
}
