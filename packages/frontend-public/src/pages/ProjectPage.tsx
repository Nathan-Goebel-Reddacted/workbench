import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LayoutPreview, type PageLayoutDto } from '@atelier/content-renderer'
import { ErrorMessage, LoadingMessage, type LoadStatus } from '../components/PageStatus'
import { fetchJson } from '../lib/fetchJson'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type ProjectDto = { id: string; name: string; visible: boolean }

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectDto | null>(null)
  const [layout, setLayout] = useState<PageLayoutDto | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  useDocumentTitle(project?.name)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      // Un projet inexistant ou masqué rend 200 sans corps : c'est « rien à montrer »,
      // pas une panne. Seul un statut d'erreur remonte en exception.
      const found = await fetchJson<ProjectDto>(`${API_URL}/projects/${id}`, signal)
      if (!found || !found.visible) return null

      const params = new URLSearchParams({ pageType: 'project', pageRef: found.id })
      const foundLayout = await fetchJson<PageLayoutDto>(`${API_URL}/page-layouts/by-ref?${params}`, signal)
      return { found, foundLayout }
    }

    setStatus('loading')
    load()
      .then(data => {
        setProject(data?.found ?? null)
        setLayout(data?.foundLayout ?? null)
        setStatus('ready')
      })
      .catch(err => {
        if (err.name !== 'AbortError') setStatus('error')
      })

    return () => controller.abort()
  }, [id, attempt])

  if (status === 'loading') return <LoadingMessage />
  if (status === 'error') return <ErrorMessage onRetry={() => setAttempt(n => n + 1)} />

  if (!project) {
    return (
      <div style={messageContainerStyle}>
        <p style={mutedStyle}>
          Ce projet n’est pas disponible.{' '}
          <Link to="/projects" style={linkStyle}>
            Voir les projets
          </Link>
        </p>
      </div>
    )
  }

  return (
    <main style={pageStyle}>
      {!layout || layout.sections.length === 0 ? (
        <h1 style={titleStyle}>{project.name}</h1>
      ) : (
        <LayoutPreview apiUrl={API_URL} sections={layout.sections} mode="public" />
      )}
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
const messageContainerStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--color-bg)',
}
const titleStyle: CSSProperties = { margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }
const linkStyle: CSSProperties = { color: 'var(--color-primary)' }
