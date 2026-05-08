import type { CSSProperties } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth, Button } from '@atelier/shared-ui'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type UserDto = {
  id: string
  name: string
  surname: string
  email: string
  roles: string[]
}

const ALL_ROLES = ['view', 'edit']

export function AdminPage() {
  const { user: currentUser } = useAuth()
  const canEdit = currentUser?.roles.includes('edit') ?? false

  const [users, setUsers] = useState<UserDto[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)

  const [whitelist, setWhitelist] = useState<string[]>([])
  const [whitelistError, setWhitelistError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')

  const fetchUsers = useCallback(async () => {
    setUsersError(null)
    try {
      const res = await fetch(`${API_URL}/users`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as UserDto[]
      setUsers(data)
    } catch {
      setUsersError('Impossible de charger les utilisateurs.')
    }
  }, [])

  const fetchWhitelist = useCallback(async () => {
    setWhitelistError(null)
    try {
      const res = await fetch(`${API_URL}/auth/allowed-emails`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { emails: string[] }
      setWhitelist(data.emails)
    } catch {
      setWhitelistError('Impossible de charger la whitelist.')
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchWhitelist()
  }, [fetchUsers, fetchWhitelist])

  const handleDeleteUser = async (id: string) => {
    const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok || res.status === 204) {
      setUsers(prev => prev.filter(u => u.id !== id))
    } else {
      setUsersError('Erreur lors de la suppression.')
    }
  }

  const handleToggleRole = async (user: UserDto, role: string) => {
    const has = user.roles.includes(role)
    const newRoles = has ? user.roles.filter(r => r !== role) : [...user.roles, role]
    const res = await fetch(`${API_URL}/users/${user.id}/roles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ roles: newRoles }),
    })
    if (res.ok || res.status === 204) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, roles: newRoles } : u))
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setUsersError(body.error ?? 'Erreur lors de la mise à jour des rôles.')
    }
  }

  const handleRemoveEmail = async (email: string) => {
    const res = await fetch(`${API_URL}/auth/allowed-emails/${encodeURIComponent(email)}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok || res.status === 204) {
      setWhitelist(prev => prev.filter(e => e !== email))
    } else {
      setWhitelistError('Erreur lors de la suppression.')
    }
  }

  const handleAddEmail = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    const res = await fetch(`${API_URL}/auth/allowed-emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
    if (res.status === 201) {
      setNewEmail('')
      setWhitelist(prev => [...prev, email])
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setWhitelistError(body.error ?? 'Erreur lors de l\'ajout.')
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Administration</h1>
      </div>

      {/* ── Section Users ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>Utilisateurs</p>
        {usersError && <p style={errorStyle}>{usersError}</p>}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
              {ALL_ROLES.map(role => (
                <th key={role} style={{ ...thStyle, width: '80px', textAlign: 'center' }}>{role}</th>
              ))}
              <th style={{ ...thStyle, width: '100px' }} />
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={trStyle}>
                <td style={tdStyle}>{u.name} {u.surname}</td>
                <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{u.email}</td>
                {ALL_ROLES.map(role => (
                  <td key={role} style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={u.roles.includes(role)}
                      onChange={() => handleToggleRole(u, role)}
                      disabled={!canEdit}
                      title={!canEdit ? 'Rôle edit requis' : undefined}
                      style={{ cursor: canEdit ? 'pointer' : 'not-allowed' }}
                    />
                  </td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={!canEdit || u.id === currentUser?.id}
                    title={
                      u.id === currentUser?.id
                        ? 'Impossible de supprimer son propre compte'
                        : !canEdit
                          ? 'Rôle edit requis'
                          : undefined
                    }
                  >
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Section Whitelist ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>Whitelist emails</p>
        {whitelistError && <p style={errorStyle}>{whitelistError}</p>}

        <div style={addRowStyle}>
          <input
            type="email"
            placeholder="nouvel@email.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddEmail()}
            style={inputStyle}
          />
          <Button variant="primary" onClick={handleAddEmail} disabled={!canEdit} title={!canEdit ? 'Rôle edit requis' : undefined}>Ajouter</Button>
        </div>

        <ul style={listStyle}>
          {whitelist.map(email => (
            <li key={email} style={listItemStyle}>
              <span style={emailSpanStyle}>{email}</span>
              <Button variant="ghost" onClick={() => handleRemoveEmail(email)} disabled={!canEdit} title={!canEdit ? 'Rôle edit requis' : undefined}>Retirer</Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem', maxWidth: '900px', margin: '0 auto' }
const headerStyle: CSSProperties = { marginBottom: '1.75rem' }
const titleStyle: CSSProperties = { fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }

const sectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}

const sectionLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}

const errorStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-primary)',
  marginBottom: '0.75rem',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid var(--color-border)',
}

const trStyle: CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
}

const tdStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  padding: '0.625rem 0.75rem',
  verticalAlign: 'middle',
}

const addRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  marginBottom: '1rem',
}

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const listItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--color-border)',
}

const emailSpanStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
}
