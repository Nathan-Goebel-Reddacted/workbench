import { DomainException } from '@shared/domain/domainException';

export class InvalidIdeaNameException extends DomainException {
    constructor(reason: string) {
        super(`Idea name ${reason}`);
    }
}
