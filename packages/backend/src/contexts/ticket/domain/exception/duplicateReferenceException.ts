import { DomainException } from "@shared/domain/domainException";

export class DuplicateReferenceException extends DomainException {
    constructor() {
        super();
        this.name = "DuplicateReferenceException";
        this.message = "A ticket with this reference already exists";
    }
}
