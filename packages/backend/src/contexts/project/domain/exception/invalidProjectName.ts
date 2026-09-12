import { DomainException } from '@shared/domain/domainException';

export class InvalidProjectNameException extends DomainException {
    constructor(reason: string) {
        super(`Project name ${reason}`);
    }
}
