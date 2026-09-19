import { getJson, send } from '../../shared/api/http'
import type { Role } from '../../shared/domain/role'
import type { User } from './types'

export function listUsers(): Promise<User[]> {
  return getJson<User[]>('/users')
}

export function deleteUser(id: string): Promise<void> {
  return send(`/users/${id}`, { method: 'DELETE' })
}

export function grantUserRole(id: string, role: Role): Promise<void> {
  return send(`/users/${id}/roles/${role}`, { method: 'POST' })
}

export function revokeUserRole(id: string, role: Role): Promise<void> {
  return send(`/users/${id}/roles/${role}`, { method: 'DELETE' })
}
