import { DomainException } from '@shared/domain/domainException';

export class DuplicateFeatureNumberException extends DomainException {
    constructor() {
        super('This owner already has a feature with that number');
    }
}
