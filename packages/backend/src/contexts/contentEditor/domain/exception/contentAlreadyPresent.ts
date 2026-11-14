import { DomainException } from '@shared/domain/domainException';

export class ContentAlreadyPresentException extends DomainException {
    constructor(present: string, incoming: string) {
        super(`This element already shows a "${present}" content: remove it before adding a "${incoming}"`);
    }
}
