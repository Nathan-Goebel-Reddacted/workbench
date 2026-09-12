import { DomainException } from '@shared/domain/domainException';
import { UserRole } from '../valueObject/role';

export class InvalidRoleException extends DomainException {
    constructor(role: string) {
        super(`Invalid role: "${role}". Allowed: ${Object.values(UserRole).join(', ')}`);
    }
}
