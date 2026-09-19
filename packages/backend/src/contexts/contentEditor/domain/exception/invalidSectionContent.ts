import { DomainException } from '@shared/domain/domainException';

export class InvalidSectionContentException extends DomainException {
    constructor(field: string, expected: string) {
        super(`Invalid section content: "${field}" must be ${expected}`);
    }
}
