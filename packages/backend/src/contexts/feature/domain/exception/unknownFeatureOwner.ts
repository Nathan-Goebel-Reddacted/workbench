import { DomainException } from '@shared/domain/domainException';

export class UnknownFeatureOwnerException extends DomainException {
    constructor() {
        super('No project or idea matches this owner');
    }
}
