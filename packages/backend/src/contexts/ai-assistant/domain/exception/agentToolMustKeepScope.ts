import { DomainException } from '@shared/domain/domainException';

export class AgentToolMustKeepScopeException extends DomainException {
    constructor() {
        super('An AgentTool must keep at least one scope');
    }
}
