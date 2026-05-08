import { DomainException } from "../domainException";

export class InvalidDocumentNameException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidDocumentNameException';
        this.message = 'Document name cannot be empty';
    }
}
