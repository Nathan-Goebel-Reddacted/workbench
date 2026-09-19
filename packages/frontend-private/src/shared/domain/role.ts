export type Role = 'view' | 'edit'

export const ROLES: readonly Role[] = ['view', 'edit']

export function hasRole(roles: readonly string[] | undefined, role: Role): boolean {
  return roles?.includes(role) ?? false
}
