import { DomainException } from '@shared/domain/domainException';

export class InvalidScopeException extends DomainException {
    constructor(value: string) {
        super();
        this.name = 'InvalidScopeException';
        this.message = `Invalid scope value: "${value}". Allowed: project, feature, ticket, idea, portfolio`;
    }
}
