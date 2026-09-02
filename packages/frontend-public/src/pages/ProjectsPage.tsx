import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorMessage, LoadingMessage, type LoadStatus } from '../components/PageStatus'
import { fetchJson } from '../lib/fetchJson'
import { useDocumentTitle } from '../lib/useDocumentTitle'

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
  useDocumentTitle('Projets')
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    setStatus('loading')
    fetchJson<ProjectSummary[]>(`${API_URL}/projects`, controller.signal)
      .then(data => {
        setProjects((data ?? []).filter(p => p.visible).sort((a, b) => a.name.localeCompare(b.name)))
        setStatus('ready')
      })
      .catch(err => {
        if (err.name !== 'AbortError') setStatus('error')
      })

    return () => controller.abort()
  }, [attempt])

  if (status === 'loading') return <LoadingMessage />
  if (status === 'error') return <ErrorMessage onRetry={() => setAttempt(n => n + 1)} />

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>Projets</h1>

      <div style={categoriesGridStyle}>
        {CATEGORIES.map(cat => {
          const list = projects.filter(p => p.category === cat.value)
          return (
            <section key={cat.value} style={sectionStyle}>
              <p style={sectionLabelStyle}>{cat.label}</p>
              {list.length === 0 ? (
                <p style={mutedStyle}>Aucun projet.</p>
              ) : (
                <ul style={listStyle}>
                  {list.map(p => (
                    <li key={p.id} style={itemStyle}>
                      <Link to={`/projects/${p.id}`} style={itemLinkStyle}>
                        <span style={itemNameStyle}>{p.name}</span>
                        {p.description && <span style={itemDescStyle}>{p.description}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}

const pageStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '2rem',
  backgroundColor: 'var(--color-bg)',
}
const titleStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  margin: '0 0 1.75rem',
}
const categoriesGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${CATEGORIES.length}, minmax(0, 1fr))`,
  gap: '1.5rem',
  alignItems: 'start',
}
const sectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
}
const sectionLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }
const listStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 }
const itemStyle: CSSProperties = { borderTop: '1px solid var(--color-border)' }
const itemLinkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  padding: '0.625rem 0',
  textDecoration: 'none',
}
const itemNameStyle: CSSProperties = { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }
const itemDescStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
