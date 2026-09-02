import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { ProjectInfoSection } from './project-detail/ProjectInfoSection'
import { LinksSection } from '../components/resource/LinksSection'
import { DocumentsSection } from '../components/resource/DocumentsSection'
import { FeaturesSection, type FeatureDto } from '../components/resource/FeaturesSection'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type ProjectDto = {
  id: string
  number: number
  reference: string
  name: string
  description: string
  visible: boolean
  category: string
  links: { url: string; displayText: string; logo: string }[]
  documents: { id: string; name: string; url: string; type: string }[]
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectDto | null>(null)
  const [features, setFeatures] = useState<FeatureDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const { signal } = controller

    Promise.all([
      fetch(`${API_URL}/projects/${id}`, { credentials: 'include', signal }),
      fetch(`${API_URL}/features/by-owner/project/${id}`, { credentials: 'include', signal }),
    ])
      .then(([rp, rf]) => Promise.all([rp.json(), rf.json()]))
      .then(([p, f]: [ProjectDto, FeatureDto[]]) => {
        setProject(p)
        setFeatures(f)
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
        <p style={mutedStyle}>Loading…</p>
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
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          ← Projects
        </Button>
        <h1 style={titleStyle}>{project.name}</h1>
        <Button
          variant="secondary"
          style={editButtonStyle}
          title="Éditer la page publique"
          aria-label="Éditer la page publique"
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
        apiUrl={API_URL}
      />
      <LinksSection resourcePath={`/projects/${project.id}`} initialLinks={project.links} apiUrl={API_URL} />
      <DocumentsSection
        resourcePath={`/projects/${project.id}`}
        initialDocuments={project.documents}
        apiUrl={API_URL}
      />
      <FeaturesSection ownerType="project" ownerId={project.id} initialFeatures={features} apiUrl={API_URL} />
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
