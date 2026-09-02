import { DomainException } from '@shared/domain/domainException';

export class InvalidFeatureOwnerException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidFeatureOwnerException';
        this.message = "A feature owner must be a 'project' or an 'idea', with a non-empty id";
    }
}
