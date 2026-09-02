import { DomainException } from '@shared/domain/domainException';

export class InvalidGridPositionException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidGridPositionException';
        this.message = 'GridPosition x/y must be >= 0 and w/h must be >= 1';
    }
}
