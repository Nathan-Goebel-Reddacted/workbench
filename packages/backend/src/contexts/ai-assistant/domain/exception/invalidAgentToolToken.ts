import { DomainException } from '@shared/domain/domainException';

export class InvalidAgentToolTokenException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidAgentToolTokenException';
        this.message = 'Agent tool token cannot be empty';
    }
}
