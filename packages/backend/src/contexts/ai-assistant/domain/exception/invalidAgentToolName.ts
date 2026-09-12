import { DomainException } from '@shared/domain/domainException';

export class InvalidAgentToolNameException extends DomainException {
    constructor() {
        super('Agent tool name cannot be empty');
    }
}
