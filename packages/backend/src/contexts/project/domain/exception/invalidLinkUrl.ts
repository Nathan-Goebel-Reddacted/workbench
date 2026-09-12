import { DomainException } from '@shared/domain/domainException';

export class InvalidLinkUrlException extends DomainException {
    constructor() {
        super('Link URL is invalid');
    }
}
