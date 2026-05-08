import { DomainException } from "@shared/domain/domainException";

export class InvalidPermissionException extends DomainException {
    constructor(value: string) {
        super();
        this.name = 'InvalidPermissionException';
        this.message = `Invalid permission value: "${value}". Allowed: read, write, read_write`;
    }
}
