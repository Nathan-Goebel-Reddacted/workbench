import { useCallback, useEffect, useState } from 'react'
import { errorDetailOr } from '../../../shared/api/http'
import type { Role } from '../../../shared/domain/role'
import { deleteUser, grantUserRole, listUsers, revokeUserRole } from '../api'
import type { User } from '../types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setUsers(await listUsers())
    } catch {
      setError('Could not load the users.')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const remove = async (id: string): Promise<void> => {
    try {
      await deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch {
      setError('Could not delete.')
    }
  }

  const toggleRole = async (user: User, role: Role): Promise<void> => {
    const granted = user.roles.includes(role)
    try {
      await (granted ? revokeUserRole(user.id, role) : grantUserRole(user.id, role))
      await reload()
    } catch (err) {
      setError(errorDetailOr(err, 'Could not update the roles.'))
    }
  }

  return { users, error, remove, toggleRole }
}
