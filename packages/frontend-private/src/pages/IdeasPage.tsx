import type { CSSProperties } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { useCanEdit } from '../contexts/EditPermissionContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type IdeaSummary = {
  id: string
  /** Identifiant lisible `0004` — le même que portera le projet si l'idée est convertie. */
  reference: string
  number: number
  name: string
  description: string
  createdAt: string
  category: string
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function IdeasPage() {
  const navigate = useNavigate()
  const canEdit = useCanEdit()
  const [ideas, setIdeas] = useState<IdeaSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchIdeas = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/ideas`, { credentials: 'include', signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as IdeaSummary[]
      setIdeas(data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') setError('Impossible de charger les idées.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchIdeas(controller.signal)
    return () => controller.abort()
  }, [fetchIdeas])

  const handleCreate = async () => {
    if (!name.trim()) {
      setCreateError('Le titre est requis.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch(`${API_URL}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), description: '', links: [], documents: [] }),
      })
      if (res.status === 201) {
        // Le numéro vient du serveur : on relit la liste plutôt que d'en inventer un.
        const listed = await fetch(`${API_URL}/ideas`, { credentials: 'include' })
        if (listed.ok) setIdeas((await listed.json()) as IdeaSummary[])
        setName('')
      } else {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        setCreateError(body.message ?? 'Erreur lors de la création.')
      }
    } catch {
      setCreateError('Erreur réseau.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Ideas</h1>
      </div>

      {/* ── Formulaire de création ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>New idea</p>
        {createError && <p style={errorStyle}>{createError}</p>}
        <div style={formRowStyle}>
          <input
            type="text"
            placeholder="Title"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canEdit && handleCreate()}
            disabled={!canEdit}
            style={inputStyle}
          />
          <Button variant="primary" onClick={handleCreate} disabled={!canEdit || creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </section>

      {/* ── Boîte à idées ── */}
      {loading && <p style={mutedStyle}>Loading…</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!loading && !error && (
        <section style={sectionStyle}>
          <p style={sectionLabelStyle}>Boîte à idées</p>
          {ideas.length === 0 && <p style={mutedStyle}>Aucune idée.</p>}
          {ideas.length > 0 && (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Title</th>
                  <th style={{ ...thStyle, width: '140px' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {ideas.map(idea => (
                  <tr
                    key={idea.id}
                    style={trStyle}
                    onClick={() => navigate(`/ideas/${idea.id}`)}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/ideas/${idea.id}`)}
                    role="button"
                    aria-label={`Open idea ${idea.name}`}
                  >
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{idea.name}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-text-muted)' }}>{formatDate(idea.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem 1.5rem', width: '100%' }
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
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }

const formRowStyle: CSSProperties = { display: 'flex', gap: '0.75rem', alignItems: 'center' }
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

const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' }
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
  cursor: 'pointer',
}
const tdStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  padding: '0.625rem 0.75rem',
  verticalAlign: 'middle',
}
