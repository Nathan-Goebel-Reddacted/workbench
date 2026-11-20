import { DomainException } from '@shared/domain/domainException';

export class UnknownScreenSizeException extends DomainException {
    constructor(screen: string, allowed: readonly string[]) {
        super(`Unknown screen size "${screen}". Allowed: ${allowed.join(', ')}`);
    }
}
