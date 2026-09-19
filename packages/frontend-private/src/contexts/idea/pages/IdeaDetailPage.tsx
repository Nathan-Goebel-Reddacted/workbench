import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { IdeaInfoSection } from '../components/IdeaInfoSection'
import { LinksSection } from '../../../shared/resource/LinksSection'
import { DocumentsSection } from '../../../shared/resource/DocumentsSection'
import { FeaturesSection } from '../../feature'
import { useIdea } from '../hooks/useIdea'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canEdit = useCanEdit()
  const { idea, loading, error, stores, remove, convertToProject } = useIdea(id)

  const [featureCount, setFeatureCount] = useState(0)
  const [converting, setConverting] = useState(false)
  const [renamed, setRenamed] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const title = renamed ?? idea?.name ?? ''

  const handleDelete = async () => {
    if (!idea) return
    const warning =
      featureCount > 0
        ? `Permanently delete the idea “${title}”, its ${featureCount} feature${featureCount > 1 ? 's' : ''} and all their tickets?`
        : `Permanently delete the idea “${title}”?`
    if (!window.confirm(warning)) return
    setDeleting(true)
    if (await remove()) navigate('/ideas')
    else setDeleting(false)
  }

  const handleConvert = async () => {
    if (!idea) return
    const confirmed = window.confirm(`Convert “${title}” into a project? This cannot be undone.`)
    if (!confirmed) return

    setConverting(true)
    const projectId = await convertToProject()
    if (projectId) navigate(`/projects/${projectId}`)
    else setConverting(false)
  }

  if (loading)
    return (
      <div style={pageStyle}>
        <p style={mutedStyle}>Loading…</p>
      </div>
    )
  if (error || !idea || !stores)
    return (
      <div style={pageStyle}>
        <p style={errorStyle}>{error ?? 'Idea not found.'}</p>
      </div>
    )

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <Button variant="ghost" onClick={() => navigate('/ideas')}>
          ← Ideas
        </Button>
        <h1 style={titleStyle}>{title}</h1>
      </div>

      <IdeaInfoSection
        ideaId={idea.id}
        initialName={idea.name}
        initialDescription={idea.description}
        initialCategory={idea.category}
        onNameSaved={setRenamed}
      />
      <LinksSection store={stores.links} initialLinks={idea.links} />
      <DocumentsSection store={stores.documents} initialDocuments={idea.documents} />

      <FeaturesSection ownerType="idea" ownerId={idea.id} onCountChange={setFeatureCount} />

      <section style={convertSectionStyle}>
        <p style={sectionLabelStyle}>Start</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <span style={mutedStyle}>
            Convert the idea into a project: its features and tickets follow, and their tickets can finally move
            forward. The idea goes away.
          </span>
          <Button variant="primary" onClick={handleConvert} disabled={!canEdit || converting}>
            {converting ? 'Converting…' : 'Convert to project'}
          </Button>
        </div>
      </section>

      <section style={dangerSectionStyle}>
        <p style={sectionLabelStyle}>Danger zone</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <span style={mutedStyle}>Deletion is permanent.</span>
          <Button variant="secondary" onClick={handleDelete} disabled={!canEdit || deleting}>
            {deleting ? 'Deleting…' : 'Delete idea'}
          </Button>
        </div>
      </section>
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem', maxWidth: '900px', margin: '0 auto' }
const headerStyle: CSSProperties = { marginBottom: '1.75rem' }
const titleStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  margin: '0.5rem 0 0',
}
const sectionLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}
const convertSectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}
const dangerSectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }
