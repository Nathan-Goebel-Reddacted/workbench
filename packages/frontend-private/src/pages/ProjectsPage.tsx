import type { CSSProperties } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { useCanEdit } from '../contexts/EditPermissionContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type Category = 'personal' | 'professional' | 'academic'

type ProjectSummary = {
  id: string
  name: string
  description: string
  visible: boolean
  category: Category
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'personal', label: 'Personnel' },
  { value: 'professional', label: 'Professionnel' },
  { value: 'academic', label: 'Scolaire' },
]

export function ProjectsPage() {
  const navigate = useNavigate()
  const canEdit = useCanEdit()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('personal')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchProjects = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/projects`, { credentials: 'include', signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ProjectSummary[]
      setProjects(data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') setError('Impossible de charger les projets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchProjects(controller.signal)
    return () => controller.abort()
  }, [fetchProjects])

  const handleCreate = async () => {
    if (!name.trim()) {
      setCreateError('Le nom est requis.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), description: '', links: [], documents: [], category: newCategory }),
      })
      if (res.status === 201) {
        const { id } = (await res.json()) as { id: string }
        setProjects(prev =>
          [...prev, { id, name: name.trim(), description: '', visible: true, category: newCategory }].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        )
        setName('')
        setNewCategory('personal')
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

  const handleToggleVisible = async (p: ProjectSummary) => {
    const newVisible = !p.visible
    setProjects(prev => prev.map(x => (x.id === p.id ? { ...x, visible: newVisible } : x)))
    try {
      const res = await fetch(`${API_URL}/projects/${p.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ visible: newVisible }),
      })
      if (!res.ok && res.status !== 204) {
        setProjects(prev => prev.map(x => (x.id === p.id ? { ...x, visible: p.visible } : x)))
      }
    } catch {
      setProjects(prev => prev.map(x => (x.id === p.id ? { ...x, visible: p.visible } : x)))
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Projects</h1>
      </div>

      {/* ── Formulaire de création ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>New project</p>
        {createError && <p style={errorStyle}>{createError}</p>}
        <div style={formRowStyle}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canEdit && handleCreate()}
            disabled={!canEdit}
            style={inputStyle}
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value as Category)}
            disabled={!canEdit}
            style={selectStyle}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={handleCreate} disabled={!canEdit || creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </section>

      {/* ── Listes par catégorie ── */}
      {loading && <p style={mutedStyle}>Loading…</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!loading && !error && (
        <div style={categoriesGridStyle}>
          {CATEGORIES.map(cat => {
            const list = projects.filter(p => p.category === cat.value)
            return (
              <section key={cat.value} style={{ ...sectionStyle, marginBottom: 0 }}>
                <p style={sectionLabelStyle}>{cat.label}</p>
                {list.length === 0 && <p style={mutedStyle}>Aucun projet.</p>}
                {list.length > 0 && (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Name</th>
                        <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Visible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(p => (
                        <tr
                          key={p.id}
                          style={trStyle}
                          onClick={() => navigate(`/projects/${p.id}`)}
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && navigate(`/projects/${p.id}`)}
                          role="button"
                          aria-label={`Open project ${p.name}`}
                        >
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{p.name}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                if (canEdit) handleToggleVisible(p)
                              }}
                              title={p.visible ? 'Visible' : 'Hidden'}
                              disabled={!canEdit}
                              style={{
                                ...switchTrackStyle,
                                backgroundColor: p.visible ? 'var(--color-primary)' : 'var(--color-border)',
                                opacity: canEdit ? 1 : 0.5,
                                cursor: canEdit ? 'pointer' : 'not-allowed',
                              }}
                            >
                              <span
                                style={{
                                  ...switchThumbStyle,
                                  transform: p.visible ? 'translateX(14px)' : 'translateX(2px)',
                                }}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem 1.5rem', width: '100%' }
const categoriesGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${CATEGORIES.length}, minmax(0, 1fr))`,
  gap: '1.5rem',
  alignItems: 'start',
}
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
const selectStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
  cursor: 'pointer',
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

const switchTrackStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  width: '30px',
  height: '18px',
  borderRadius: '9px',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
}
const switchThumbStyle: CSSProperties = {
  position: 'absolute',
  top: '2px',
  left: 0,
  width: '14px',
  height: '14px',
  // Le rail passe de --color-primary à --color-border : le fond de page contraste avec les deux,
  // dans les deux thèmes, là où un blanc fixe disparaissait sur la piste claire du thème sombre.
  borderRadius: '50%',
  backgroundColor: 'var(--color-bg)',
  transition: 'transform 0.2s',
}
