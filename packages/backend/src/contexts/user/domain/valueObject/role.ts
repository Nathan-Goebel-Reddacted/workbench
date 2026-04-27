export enum UserRole {
    VIEW = 'view',
    EDIT = 'edit',
}

export function normalizeRoles(roles: UserRole[]): UserRole[] {
    return [...new Set(roles)];
}

export function hasRole(roles: UserRole[], role: UserRole): boolean {
    return roles.includes(role);
}
