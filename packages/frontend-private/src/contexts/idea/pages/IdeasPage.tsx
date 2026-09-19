import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { useIdeas } from '../hooks/useIdeas'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function IdeasPage() {
  const navigate = useNavigate()
  const canEdit = useCanEdit()
  const { ideas, loading, error, createError, creating, create } = useIdeas()
  const [name, setName] = useState('')

  const handleCreate = async () => {
    if (await create(name)) setName('')
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Ideas</h1>
      </div>

      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>New idea</p>
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
          <Button variant="primary" onClick={handleCreate} disabled={!canEdit || creating || !name.trim()}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </section>

      {loading && <p style={mutedStyle}>Loading…</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!loading && !error && (
        <section style={sectionStyle}>
          <p style={sectionLabelStyle}>Idea box</p>
          {ideas.length === 0 && <p style={mutedStyle}>No idea yet.</p>}
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
