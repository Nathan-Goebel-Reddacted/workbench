import { DomainException } from '@shared/domain/domainException';

export class InvalidScopeException extends DomainException {
    constructor(value: string) {
        super(`Invalid scope value: "${value}". Allowed: project, feature, ticket, idea, portfolio`);
    }
}
