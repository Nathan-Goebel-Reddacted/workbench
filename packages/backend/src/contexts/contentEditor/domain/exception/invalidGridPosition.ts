import { DomainException } from "@shared/domain/domainException";

export class InvalidGridPositionException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidGridPositionException';
        this.message = 'GridPosition column must be >= 1 and order must be >= 0';
    }
}
