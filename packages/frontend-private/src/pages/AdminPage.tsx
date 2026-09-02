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

type AccessRequestDto = {
  email: string
  displayName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

type PairingRequestDto = {
  id: string
  name: string
  requestedScopes: string[]
  requestedPermission: string
  codePrefix: string
  status: 'pending' | 'approved' | 'claimed' | 'rejected'
  expiresAt: string
}

type AgentToolDto = {
  id: string
  userId: string
  name: string
  permission: string
  scopes: string[]
  createdAt: string
  revokedAt: string | null
}

const ALL_ROLES = ['view', 'edit']
const ALL_SCOPES = ['project', 'feature', 'ticket', 'idea', 'portfolio']
const ALL_PERMISSIONS = ['read', 'write', 'read_write']

export function AdminPage() {
  const { user: currentUser } = useAuth()
  const canEdit = currentUser?.roles.includes('edit') ?? false

  const [users, setUsers] = useState<UserDto[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)

  const [whitelist, setWhitelist] = useState<string[]>([])
  const [whitelistError, setWhitelistError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')

  const [accessRequests, setAccessRequests] = useState<AccessRequestDto[]>([])
  const [pairingRequests, setPairingRequests] = useState<PairingRequestDto[]>([])
  const [requestsError, setRequestsError] = useState<string | null>(null)

  const [agentTools, setAgentTools] = useState<AgentToolDto[]>([])
  const [agentToolsError, setAgentToolsError] = useState<string | null>(null)
  // Rotation de jeton : deux temps dans une seule fenêtre — on confirme, puis on lit le
  // secret. `token` reste nul tant que la rotation n'a pas eu lieu.
  const [rotation, setRotation] = useState<{ tool: AgentToolDto; token: string | null } | null>(null)
  const [rotationError, setRotationError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchUsers = useCallback(async () => {
    setUsersError(null)
    try {
      const res = await fetch(`${API_URL}/users`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as UserDto[]
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
      const data = (await res.json()) as { emails: string[] }
      setWhitelist(data.emails)
    } catch {
      setWhitelistError('Impossible de charger la whitelist.')
    }
  }, [])

  const fetchRequests = useCallback(async () => {
    setRequestsError(null)
    try {
      const [humansRes, agentsRes] = await Promise.all([
        fetch(`${API_URL}/auth/access-requests`, { credentials: 'include' }),
        fetch(`${API_URL}/agent-pairing-requests`, { credentials: 'include' }),
      ])
      if (!humansRes.ok || !agentsRes.ok) throw new Error('HTTP error')
      const humans = (await humansRes.json()) as { requests: AccessRequestDto[] }
      const agents = (await agentsRes.json()) as { requests: PairingRequestDto[] }
      setAccessRequests(humans.requests)
      setPairingRequests(agents.requests)
    } catch {
      setRequestsError("Impossible de charger les demandes d'accès.")
    }
  }, [])

  const fetchAgentTools = useCallback(async () => {
    setAgentToolsError(null)
    try {
      const res = await fetch(`${API_URL}/agent-tools`, { credentials: 'include' })
      if (!res.ok) throw new Error('HTTP error')
      setAgentTools((await res.json()) as AgentToolDto[])
    } catch {
      setAgentToolsError('Impossible de charger les agents IA.')
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchWhitelist()
    fetchRequests()
    fetchAgentTools()
  }, [fetchUsers, fetchWhitelist, fetchRequests, fetchAgentTools])

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
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, roles: newRoles } : u)))
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setUsersError(body.error ?? 'Erreur lors de la mise à jour des rôles.')
    }
  }

  const handleRemoveEmail = async (email: string) => {
    const res = await fetch(`${API_URL}/auth/allowed-emails/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
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
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setWhitelistError(body.error ?? "Erreur lors de l'ajout.")
    }
  }

  const handleHumanRequest = async (email: string, action: 'approve' | 'reject') => {
    const res = await fetch(`${API_URL}/auth/access-requests/${encodeURIComponent(email)}/${action}`, {
      method: 'POST',
      credentials: 'include',
    })
    if (res.ok || res.status === 204) {
      setAccessRequests(prev =>
        prev.map(r => (r.email === email ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r)),
      )
      if (action === 'approve') setWhitelist(prev => (prev.includes(email) ? prev : [...prev, email]))
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setRequestsError(body.error ?? 'Erreur lors du traitement de la demande.')
    }
  }

  const handleAgentRequest = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch(`${API_URL}/agent-pairing-requests/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      // The agent is attached to the administrator granting it.
      body: action === 'approve' ? JSON.stringify({ userId: currentUser?.id }) : undefined,
    })
    if (res.ok || res.status === 204) {
      fetchRequests()
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setRequestsError(body.error ?? 'Erreur lors du traitement de la demande.')
    }
  }

  const handleToggleRevoke = async (tool: AgentToolDto) => {
    const action = tool.revokedAt ? 'restore' : 'revoke'
    const res = await fetch(`${API_URL}/agent-tools/${tool.id}/${action}`, {
      method: 'POST',
      credentials: 'include',
    })
    if (res.ok || res.status === 204) {
      setAgentTools(prev =>
        prev.map(t =>
          t.id === tool.id ? { ...t, revokedAt: action === 'revoke' ? new Date().toISOString() : null } : t,
        ),
      )
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setAgentToolsError(body.error ?? "Erreur lors de la mise à jour de l'agent.")
    }
  }

  const handleChangePermission = async (tool: AgentToolDto, permission: string) => {
    const res = await fetch(`${API_URL}/agent-tools/${tool.id}/permission`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ permission }),
    })
    if (res.ok || res.status === 204) {
      setAgentTools(prev => prev.map(t => (t.id === tool.id ? { ...t, permission } : t)))
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setAgentToolsError(body.error ?? 'Erreur lors de la mise à jour de la permission.')
    }
  }

  const handleToggleScope = async (tool: AgentToolDto, scope: string) => {
    const has = tool.scopes.includes(scope)
    // The aggregate refuses to drop the last scope: an agent without scope could not act at all.
    if (has && tool.scopes.length === 1) return
    const res = await fetch(`${API_URL}/agent-tools/${tool.id}/scopes`, {
      method: has ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ scope }),
    })
    if (res.ok || res.status === 204) {
      const scopes = has ? tool.scopes.filter(s => s !== scope) : [...tool.scopes, scope]
      setAgentTools(prev => prev.map(t => (t.id === tool.id ? { ...t, scopes } : t)))
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setAgentToolsError(body.error ?? 'Erreur lors de la mise à jour des scopes.')
    }
  }

  const handleRotateToken = async () => {
    if (!rotation) return
    setRotationError(null)
    const res = await fetch(`${API_URL}/agent-tools/${rotation.tool.id}/rotate-token`, {
      method: 'POST',
      credentials: 'include',
    })
    if (res.ok) {
      const body = (await res.json()) as { token: string }
      setRotation({ tool: rotation.tool, token: body.token })
      setCopied(false)
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setRotationError(body.error ?? 'Erreur lors de la régénération du jeton.')
    }
  }

  const handleCopyToken = async () => {
    if (!rotation?.token) return
    try {
      await navigator.clipboard.writeText(rotation.token)
      setCopied(true)
    } catch {
      // Presse-papiers refusé (contexte non sécurisé, permission) : le jeton reste
      // sélectionnable à la main dans le champ, c'est le seul recours.
      setRotationError('Copie impossible — sélectionnez le jeton pour le copier à la main.')
    }
  }

  const closeRotation = () => {
    setRotation(null)
    setRotationError(null)
    setCopied(false)
  }

  const userLabel = (userId: string) => {
    const owner = users.find(u => u.id === userId)
    return owner ? `${owner.name} ${owner.surname}` : '—'
  }

  const pendingHumans = accessRequests.filter(r => r.status === 'pending')
  const pendingAgents = pairingRequests.filter(r => r.status === 'pending')
  const hasPending = pendingHumans.length > 0 || pendingAgents.length > 0

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Administration</h1>
      </div>

      {/* ── Section Demandes d'accès ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>
          Demandes d'accès{hasPending ? ` (${pendingHumans.length + pendingAgents.length})` : ''}
        </p>
        {requestsError && <p style={errorStyle}>{requestsError}</p>}

        {!hasPending && !requestsError && <p style={emptyStyle}>Aucune demande en attente.</p>}

        {hasPending && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Demandeur</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Détail</th>
                <th style={{ ...thStyle, width: '190px' }} />
              </tr>
            </thead>
            <tbody>
              {pendingHumans.map(r => (
                <tr key={r.email} style={trStyle}>
                  <td style={tdStyle}>{r.displayName}</td>
                  <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>Utilisateur</td>
                  <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{r.email}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Button
                      variant="primary"
                      onClick={() => handleHumanRequest(r.email, 'approve')}
                      disabled={!canEdit}
                      title={!canEdit ? 'Rôle edit requis' : undefined}
                    >
                      Approuver
                    </Button>{' '}
                    <Button
                      variant="ghost"
                      onClick={() => handleHumanRequest(r.email, 'reject')}
                      disabled={!canEdit}
                      title={!canEdit ? 'Rôle edit requis' : undefined}
                    >
                      Rejeter
                    </Button>
                  </td>
                </tr>
              ))}
              {pendingAgents.map(r => (
                <tr key={r.id} style={trStyle}>
                  <td style={tdStyle}>{r.name}</td>
                  <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>Agent IA</td>
                  <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>
                    <span style={codeStyle}>{r.codePrefix}-••••</span> {r.requestedPermission} ·{' '}
                    {r.requestedScopes.join(', ')}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Button
                      variant="primary"
                      onClick={() => handleAgentRequest(r.id, 'approve')}
                      disabled={!canEdit}
                      title={!canEdit ? 'Rôle edit requis' : undefined}
                    >
                      Approuver
                    </Button>{' '}
                    <Button
                      variant="ghost"
                      onClick={() => handleAgentRequest(r.id, 'reject')}
                      disabled={!canEdit}
                      title={!canEdit ? 'Rôle edit requis' : undefined}
                    >
                      Rejeter
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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

      {/* ── Section Agents IA ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>Agents IA</p>
        {agentToolsError && <p style={errorStyle}>{agentToolsError}</p>}

        {agentTools.length === 0 && !agentToolsError && <p style={emptyStyle}>Aucun agent appairé.</p>}

        {agentTools.length > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Agent</th>
                <th style={thStyle}>Rattaché à</th>
                <th style={{ ...thStyle, width: '130px' }}>Permission</th>
                <th style={thStyle}>Scopes</th>
                <th style={{ ...thStyle, width: '110px' }}>Créé le</th>
                <th style={{ ...thStyle, width: '110px' }} />
              </tr>
            </thead>
            <tbody>
              {agentTools.map(t => {
                const revoked = t.revokedAt !== null
                return (
                  <tr key={t.id} style={{ ...trStyle, opacity: revoked ? 0.5 : 1 }}>
                    <td style={tdStyle}>
                      {t.name}
                      {revoked && <span style={revokedBadgeStyle}>révoqué</span>}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{userLabel(t.userId)}</td>
                    <td style={tdStyle}>
                      <select
                        value={t.permission}
                        onChange={e => handleChangePermission(t, e.target.value)}
                        disabled={!canEdit || revoked}
                        title={!canEdit ? 'Rôle edit requis' : undefined}
                        style={selectStyle}
                      >
                        {ALL_PERMISSIONS.map(p => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <div style={scopeRowStyle}>
                        {ALL_SCOPES.map(scope => {
                          const checked = t.scopes.includes(scope)
                          const isLast = checked && t.scopes.length === 1
                          return (
                            <label
                              key={scope}
                              style={{ ...scopeLabelStyle, opacity: checked ? 1 : 0.45 }}
                              title={isLast ? 'Un agent doit garder au moins un scope' : undefined}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleScope(t, scope)}
                                disabled={!canEdit || revoked || isLast}
                                style={{ cursor: canEdit && !revoked && !isLast ? 'pointer' : 'not-allowed' }}
                              />
                              {scope}
                            </label>
                          )
                        })}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>
                      {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <Button
                        variant="ghost"
                        onClick={() => handleToggleRevoke(t)}
                        disabled={!canEdit}
                        title={!canEdit ? 'Rôle edit requis' : undefined}
                      >
                        {revoked ? 'Réactiver' : 'Révoquer'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setRotation({ tool: t, token: null })}
                        disabled={!canEdit || revoked}
                        title={!canEdit ? 'Rôle edit requis' : revoked ? 'Agent révoqué' : 'Régénérer le jeton'}
                      >
                        Régénérer
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
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
          <Button
            variant="primary"
            onClick={handleAddEmail}
            disabled={!canEdit}
            title={!canEdit ? 'Rôle edit requis' : undefined}
          >
            Ajouter
          </Button>
        </div>

        <ul style={listStyle}>
          {whitelist.map(email => (
            <li key={email} style={listItemStyle}>
              <span style={emailSpanStyle}>{email}</span>
              <Button
                variant="ghost"
                onClick={() => handleRemoveEmail(email)}
                disabled={!canEdit}
                title={!canEdit ? 'Rôle edit requis' : undefined}
              >
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {rotation && (
        <div style={overlayStyle} onClick={closeRotation}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <p style={sectionLabelStyle}>Jeton de l'agent {rotation.tool.name}</p>
            {rotationError && <p style={errorStyle}>{rotationError}</p>}

            {rotation.token === null ? (
              <>
                <p style={modalTextStyle}>
                  Régénérer le jeton coupe immédiatement l'accès de cet agent : son jeton actuel cesse de fonctionner et
                  le nouveau devra être recollé dans sa configuration MCP.
                </p>
                <div style={modalActionsStyle}>
                  <Button variant="ghost" onClick={closeRotation}>
                    Annuler
                  </Button>
                  <Button variant="primary" onClick={handleRotateToken}>
                    Régénérer
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p style={modalTextStyle}>
                  Le serveur n'en garde qu'une empreinte : c'est le seul moment où ce jeton est lisible. Fermer cette
                  fenêtre sans l'avoir copié oblige à en régénérer un autre.
                </p>
                <input readOnly value={rotation.token} style={tokenInputStyle} onFocus={e => e.target.select()} />
                <div style={modalActionsStyle}>
                  <Button variant="ghost" onClick={handleCopyToken}>
                    {copied ? 'Copié' : 'Copier'}
                  </Button>
                  <Button variant="primary" onClick={closeRotation}>
                    Fermer
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

const selectStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  padding: '0.25rem 0.375rem',
  outline: 'none',
}

const scopeRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
}

const scopeLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontSize: '0.75rem',
  color: 'var(--color-text)',
}

const revokedBadgeStyle: CSSProperties = {
  marginLeft: '0.5rem',
  fontSize: '0.6875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  padding: '0.0625rem 0.3125rem',
}

const emptyStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  margin: 0,
}

const codeStyle: CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  padding: '0.125rem 0.375rem',
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'color-mix(in srgb, var(--color-text) 45%, transparent)',
  padding: '1rem',
  zIndex: 100,
}

const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
}

const modalTextStyle: CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: 1.5,
  color: 'var(--color-text-muted)',
  margin: '0 0 1rem',
}

const tokenInputStyle: CSSProperties = {
  ...codeStyle,
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.5rem 0.625rem',
  marginBottom: '1rem',
}

const modalActionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
}
