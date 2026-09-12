import { DomainException } from '@shared/domain/domainException';

export class EmailAlreadyAllowedException extends DomainException {
    constructor(email: string) {
        super(`Email already allowed: ${email}`);
    }
}
