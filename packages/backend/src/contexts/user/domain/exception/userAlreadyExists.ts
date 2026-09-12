import { DomainException } from '@shared/domain/domainException';

export class UserAlreadyExistsException extends DomainException {
    constructor(email: string) {
        super(`An account already exists for ${email}`);
    }
}
