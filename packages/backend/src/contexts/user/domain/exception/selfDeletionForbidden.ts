import { DomainException } from '@shared/domain/domainException';

export class SelfDeletionForbiddenException extends DomainException {
    constructor() {
        super('An account cannot delete itself: another editor has to do it');
    }
}
