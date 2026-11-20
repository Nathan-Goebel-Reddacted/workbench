import { DomainException } from '@shared/domain/domainException';

export class ElementNotFoundException extends DomainException {
    constructor(elementId: string) {
        super(`Element not found on this page: ${elementId}`);
    }
}
