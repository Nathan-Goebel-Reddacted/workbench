import { DomainException } from '@shared/domain/domainException';

export class InvalidComponentException extends DomainException {
    constructor(field: string, expected: string) {
        super(`Invalid component: "${field}" must be ${expected}`);
    }
}
