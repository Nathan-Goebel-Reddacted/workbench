import { DomainException } from '@shared/domain/domainException';

export class InvalidGridPositionException extends DomainException {
    constructor() {
        super('GridPosition x/y must be >= 0, w/h must be >= 1 and the section must fit within the grid columns');
    }
}
