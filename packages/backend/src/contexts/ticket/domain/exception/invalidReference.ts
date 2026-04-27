import { DomainException } from "@shared/domain/domainException";

export class InvalidReferenceException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidReferenceException';
        this.message = 'Ticket reference must follow the format XXXX.Y (e.g. 0022.3)';
    }
}
