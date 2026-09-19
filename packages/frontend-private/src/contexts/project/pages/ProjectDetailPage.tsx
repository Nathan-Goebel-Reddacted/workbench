import type { CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { ProjectInfoSection } from '../components/ProjectInfoSection'
import { LinksSection } from '../../../shared/resource/LinksSection'
import { DocumentsSection } from '../../../shared/resource/DocumentsSection'
import { FeaturesSection } from '../../feature'
import { useProject } from '../hooks/useProject'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { project, loading, error, stores } = useProject(id)

  if (loading)
    return (
      <div style={pageStyle}>
        <p style={mutedStyle}>Loading…</p>
      </div>
    )
  if (error || !project || !stores)
    return (
      <div style={pageStyle}>
        <p style={errorStyle}>{error ?? 'Project not found.'}</p>
      </div>
    )

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          ← Projects
        </Button>
        <h1 style={titleStyle}>{project.name}</h1>
        <Button
          variant="secondary"
          style={editButtonStyle}
          title="Edit the public page"
          aria-label="Edit the public page"
          onClick={() => navigate(`/projects/${project.id}/page`)}
        >
          <PencilIcon />
        </Button>
      </div>

      <ProjectInfoSection
        projectId={project.id}
        initialName={project.name}
        initialDescription={project.description}
        initialCategory={project.category}
      />
      <LinksSection store={stores.links} initialLinks={project.links} />
      <DocumentsSection store={stores.documents} initialDocuments={project.documents} />
      <FeaturesSection ownerType="project" ownerId={project.id} />
    </div>
  )
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

const pageStyle: CSSProperties = { padding: '2rem', maxWidth: '900px', margin: '0 auto' }
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }
const editButtonStyle: CSSProperties = { marginLeft: 'auto', padding: '0.5rem' }
const titleStyle: CSSProperties = { fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)' }
