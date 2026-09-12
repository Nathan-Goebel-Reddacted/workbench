import { DomainException } from '@shared/domain/domainException';

export class DefaultThemeMustBeVisibleException extends DomainException {
    constructor() {
        super('The default theme is the one the public site falls back to: it cannot be hidden');
    }
}
