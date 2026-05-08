import { DomainException } from "@shared/domain/domainException";

export class InvalidAgentToolNameException extends DomainException {
    constructor() {
        super();
        this.name = 'InvalidAgentToolNameException';
        this.message = 'Agent tool name cannot be empty';
    }
}
