import { DomainException } from '@shared/domain/domainException';

export class UnknownComponentKindException extends DomainException {
    constructor(kind: string, allowed: readonly string[]) {
        super(`Unknown component kind "${kind}". Allowed: ${allowed.join(', ')}`);
    }
}
