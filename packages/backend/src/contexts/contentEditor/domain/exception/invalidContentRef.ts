import { DomainException } from "@shared/domain/domainException";

export class InvalidContentRefException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidContentRefException';
        this.message = 'ContentRef must follow the format "context.field"';
    }
}
