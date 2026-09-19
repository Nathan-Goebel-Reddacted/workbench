import { Button, useAuth } from '@atelier/shared-ui'
import { EDIT_ROLE_REQUIRED, useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { ROLES } from '../../../shared/domain/role'
import {
  errorStyle,
  mutedTdStyle,
  sectionLabelStyle,
  sectionStyle,
  tableStyle,
  tdStyle,
  thStyle,
  trStyle,
} from '../../../shared/components/adminStyles'
import { useUsers } from '../hooks/useUsers'
import type { User } from '../types'

export function UsersSection() {
  const { user: currentUser } = useAuth()
  const canEdit = useCanEdit()
  const { users, error, remove, toggleRole } = useUsers()

  const deleteTitle = (user: User) => {
    if (user.id === currentUser?.id) return 'You cannot delete your own account'
    return canEdit ? undefined : EDIT_ROLE_REQUIRED
  }

  return (
    <section style={sectionStyle}>
      <p style={sectionLabelStyle}>Users</p>
      {error && <p style={errorStyle}>{error}</p>}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            {ROLES.map(role => (
              <th key={role} style={{ ...thStyle, width: '80px', textAlign: 'center' }}>
                {role}
              </th>
            ))}
            <th style={{ ...thStyle, width: '100px' }} />
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={trStyle}>
              <td style={tdStyle}>
                {u.name} {u.surname}
              </td>
              <td style={mutedTdStyle}>{u.email}</td>
              {ROLES.map(role => (
                <td key={role} style={{ ...tdStyle, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={u.roles.includes(role)}
                    onChange={() => toggleRole(u, role)}
                    disabled={!canEdit}
                    title={canEdit ? undefined : EDIT_ROLE_REQUIRED}
                    style={{ cursor: canEdit ? 'pointer' : 'not-allowed' }}
                  />
                </td>
              ))}
              <td style={{ ...tdStyle, textAlign: 'right' }}>
                <Button
                  variant="ghost"
                  onClick={() => remove(u.id)}
                  disabled={!canEdit || u.id === currentUser?.id}
                  title={deleteTitle(u)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
