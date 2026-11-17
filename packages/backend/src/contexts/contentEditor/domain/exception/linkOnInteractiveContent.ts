import { DomainException } from '@shared/domain/domainException';

export class LinkOnInteractiveContentException extends DomainException {
    constructor(content: string) {
        super(`A "${content}" content takes its own clicks: it cannot be wrapped in a link`);
    }
}
