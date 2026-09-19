import { DomainException } from '@shared/domain/domainException';

export class AgentToolRevokedException extends DomainException {
    constructor() {
        super('A revoked AgentTool cannot be changed: restore it first');
    }
}
