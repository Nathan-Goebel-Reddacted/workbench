import { DomainException } from '@shared/domain/domainException';

export class InvalidAgentToolTokenException extends DomainException {
    constructor() {
        super('Agent tool token cannot be empty');
    }
}
