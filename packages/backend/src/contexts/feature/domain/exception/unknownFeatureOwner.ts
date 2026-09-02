import { DomainException } from '@shared/domain/domainException';

export class UnknownFeatureOwnerException extends DomainException {
    constructor() {
        super();
        this.name = 'UnknownFeatureOwnerException';
        this.message = 'No project or idea matches this owner';
    }
}
