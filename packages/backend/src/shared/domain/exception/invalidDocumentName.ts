import { DomainException } from '../domainException';

export class InvalidDocumentNameException extends DomainException {
    constructor() {
        super('Document name cannot be empty');
    }
}
