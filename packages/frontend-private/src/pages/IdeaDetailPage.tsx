import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@atelier/shared-ui'
import { IdeaInfoSection } from './idea-detail/IdeaInfoSection'
import { LinksSection } from '../components/resource/LinksSection'
import { DocumentsSection } from '../components/resource/DocumentsSection'
import { FeaturesSection, type FeatureDto } from '../components/resource/FeaturesSection'
import { useCanEdit } from '../contexts/EditPermissionContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type IdeaDto = {
  id: string
  number: number
  reference: string
  category: string
  name: string
  description: string
  createdAt: string
  links: { url: string; displayText: string; logo: string }[]
  documents: { id: string; name: string; url: string; type: string }[]
}

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canEdit = useCanEdit()

  const [idea, setIdea] = useState<IdeaDto | null>(null)
  const [features, setFeatures] = useState<FeatureDto[]>([])
  const [converting, setConverting] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()

    Promise.all([
      fetch(`${API_URL}/ideas/${id}`, { credentials: 'include', signal: controller.signal }),
      fetch(`${API_URL}/features/by-owner/idea/${id}`, { credentials: 'include', signal: controller.signal }),
    ])
      .then(([ri, rf]) => Promise.all([ri.json(), rf.json()]))
      .then(([data, feats]: [IdeaDto | null, FeatureDto[]]) => {
        if (!data) {
          setError('Idée introuvable.')
          setLoading(false)
          return
        }
        setIdea(data)
        setTitle(data.name)
        setFeatures(feats)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError("Impossible de charger l'idée.")
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [id])

  const handleDelete = async () => {
    if (!idea) return
    // La suppression emporte features et tickets : on annonce ce qui part.
    const featureCount = features.length
    const warning =
      featureCount > 0
        ? `Supprimer définitivement l'idée « ${title} », ses ${featureCount} feature${featureCount > 1 ? 's' : ''} et tous leurs tickets ?`
        : `Supprimer définitivement l'idée « ${title} » ?`
    if (!window.confirm(warning)) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_URL}/ideas/${idea.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok || res.status === 204) {
        navigate('/ideas')
      } else {
        setError('Erreur lors de la suppression.')
        setDeleting(false)
      }
    } catch {
      setError('Erreur réseau.')
      setDeleting(false)
    }
  }

  const handleConvert = async () => {
    if (!idea) return
    const confirmed = window.confirm(
      `Convertir « ${title} » en projet ?

` +
        `Le projet reprend le contenu de l'idée, ses features et ses tickets, et garde le même ` +
        `numéro (${idea.reference}) : les références des tickets ne changent pas.
` +
        `L'idée est ensuite supprimée, et le projet créé reste privé.`,
    )
    if (!confirmed) return

    setConverting(true)
    try {
      const res = await fetch(`${API_URL}/ideas/${idea.id}/convert-to-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category: idea.category }),
      })
      if (res.status === 201) {
        const { projectId } = (await res.json()) as { projectId: string }
        navigate(`/projects/${projectId}`)
      } else {
        setError('Erreur lors de la conversion.')
        setConverting(false)
      }
    } catch {
      setError('Erreur réseau.')
      setConverting(false)
    }
  }

  if (loading)
    return (
      <div style={pageStyle}>
        <p style={mutedStyle}>Loading…</p>
      </div>
    )
  if (error || !idea)
    return (
      <div style={pageStyle}>
        <p style={errorStyle}>{error ?? 'Idée introuvable.'}</p>
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
        apiUrl={API_URL}
        onNameSaved={setTitle}
      />
      <LinksSection resourcePath={`/ideas/${idea.id}`} initialLinks={idea.links} apiUrl={API_URL} />
      <DocumentsSection resourcePath={`/ideas/${idea.id}`} initialDocuments={idea.documents} apiUrl={API_URL} />

      <FeaturesSection ownerType="idea" ownerId={idea.id} initialFeatures={features} apiUrl={API_URL} />

      <section style={convertSectionStyle}>
        <p style={sectionLabelStyle}>Démarrer</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <span style={mutedStyle}>
            Convertir l'idée en projet : ses features et ses tickets suivent, et leurs tickets pourront enfin avancer.
            L'idée disparaît.
          </span>
          <Button variant="primary" onClick={handleConvert} disabled={!canEdit || converting}>
            {converting ? 'Converting…' : 'Convert to project'}
          </Button>
        </div>
      </section>

      <section style={dangerSectionStyle}>
        <p style={sectionLabelStyle}>Danger zone</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <span style={mutedStyle}>La suppression est définitive.</span>
          <Button variant="secondary" onClick={handleDelete} disabled={!canEdit || deleting}>
            {deleting ? 'Deleting…' : 'Delete idea'}
          </Button>
        </div>
      </section>
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem 1.5rem', width: '100%' }
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
