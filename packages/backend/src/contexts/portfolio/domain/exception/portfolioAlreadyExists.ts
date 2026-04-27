import { DomainException } from "@shared/domain/domainException";

export class PortfolioAlreadyExistsException extends DomainException {
    constructor() {
        super();
        this.name = 'PortfolioAlreadyExistsException';
        this.message = 'A portfolio already exists for this user';
    }
}
