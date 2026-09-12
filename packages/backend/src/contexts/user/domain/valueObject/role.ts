import { UserRole } from '@shared/domain/valueObject/userRole';

export { UserRole };

export function normalizeRoles(roles: UserRole[]): UserRole[] {
    return [...new Set(roles)];
}

export function hasRole(roles: UserRole[], role: UserRole): boolean {
    return roles.includes(role);
}
