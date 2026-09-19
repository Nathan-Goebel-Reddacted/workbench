import type { CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { GridBuilder } from '../../content-editor'
import { useProject } from '../hooks/useProject'

export function ProjectPageEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { project, loading, error } = useProject(id)

  if (loading)
    return (
      <div style={pageStyle}>
        <p style={mutedStyle}>Loading…</p>
      </div>
    )
  if (error || !project)
    return (
      <div style={pageStyle}>
        <p style={errorStyle}>{error ?? 'Project not found.'}</p>
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
        <GridBuilder pageType="project" pageRef={project.id} />
      </div>
    </div>
  )
}

const pageStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem 2rem 1.25rem' }
const builderStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '2rem' }
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)', padding: '2rem' }
