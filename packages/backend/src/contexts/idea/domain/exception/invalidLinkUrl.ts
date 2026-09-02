import { DomainException } from '@shared/domain/domainException';

export class InvalidLinkUrlException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidLinkUrlException';
        this.message = 'Link URL is invalid';
    }
}
