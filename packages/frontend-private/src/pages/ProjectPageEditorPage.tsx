import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { GridBuilder } from '../components/grid-builder/GridBuilder'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type ProjectDto = { id: string; name: string }

export function ProjectPageEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()

    fetch(`${API_URL}/projects/${id}`, { credentials: 'include', signal: controller.signal })
      .then(res => res.json() as Promise<ProjectDto>)
      .then(data => {
        setProject(data)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError('Impossible de charger le projet.')
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [id])

  if (loading)
    return (
      <div style={pageStyle}>
        <p style={mutedStyle}>Chargement…</p>
      </div>
    )
  if (error || !project)
    return (
      <div style={pageStyle}>
        <p style={errorStyle}>{error ?? 'Projet introuvable.'}</p>
      </div>
    )

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <Button variant="ghost" onClick={() => navigate(`/projects/${project.id}`)}>
          ← {project.name}
        </Button>
      </div>
      <div style={builderStyle}>
        <GridBuilder pageType="project" pageRef={project.id} apiUrl={API_URL} />
      </div>
    </div>
  )
}

const pageStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem 2rem 1.25rem' }
const builderStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '2rem' }
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)', padding: '2rem' }
