import { DomainException } from '../domainException';

export class NotAStoredMindmapException extends DomainException {
    constructor() {
        super('Not a mindmap stored by the site');
    }
}
