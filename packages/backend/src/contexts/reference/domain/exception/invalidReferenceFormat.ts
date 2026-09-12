import { DomainException } from '@shared/domain/domainException';

export class InvalidReferenceFormatException extends DomainException {
    constructor() {
        super("A reference looks like '4', '4.8' or '4.8.23'");
    }
}
