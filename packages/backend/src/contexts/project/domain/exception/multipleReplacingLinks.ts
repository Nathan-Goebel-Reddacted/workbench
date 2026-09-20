import { DomainException } from '@shared/domain/domainException';

export class MultipleReplacingLinksException extends DomainException {
    constructor() {
        super('A project has at most one link replacing its page');
    }
}
