import { DomainException } from '../domainException';

export class InvalidDocumentUrlException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidDocumentUrlException';
        this.message = 'Document URL cannot be empty';
    }
}
