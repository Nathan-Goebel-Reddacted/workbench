import { DomainException } from '@shared/domain/domainException';

export class DuplicateFeatureNumberException extends DomainException {
    constructor() {
        super();
        this.name = 'DuplicateFeatureNumberException';
        this.message = 'This owner already has a feature with that number';
    }
}
