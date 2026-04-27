import { DomainException } from "@shared/domain/domainException";

export class UserIdRequiredException extends DomainException {
    constructor() {
        super();
        this.name = 'UserIdRequiredException';
        this.message = 'User ID is required';
    }
}