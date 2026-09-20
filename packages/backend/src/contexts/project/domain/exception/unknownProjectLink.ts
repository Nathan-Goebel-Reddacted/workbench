import { DomainException } from '@shared/domain/domainException';

export class UnknownProjectLinkException extends DomainException {
    constructor() {
        super('This project has no such link');
    }
}
