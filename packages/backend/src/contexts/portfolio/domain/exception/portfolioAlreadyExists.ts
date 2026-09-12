import { DomainException } from '@shared/domain/domainException';

export class PortfolioAlreadyExistsException extends DomainException {
    constructor() {
        super('A portfolio already exists: the application holds exactly one');
    }
}
