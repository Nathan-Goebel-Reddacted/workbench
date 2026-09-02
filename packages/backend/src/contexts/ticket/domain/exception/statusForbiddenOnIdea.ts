import { DomainException } from '@shared/domain/domainException';

export class StatusForbiddenOnIdeaException extends DomainException {
    constructor() {
        super();
        this.name = 'StatusForbiddenOnIdeaException';
        this.message = 'A ticket held by an idea stays pending: the work has not started yet';
    }
}
