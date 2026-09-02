import { DomainException } from '@shared/domain/domainException';

export class AgentToolMustKeepScopeException extends DomainException {
    constructor() {
        super();
        this.name = 'AgentToolMustKeepScopeException';
        this.message = 'An AgentTool must keep at least one scope';
    }
}
