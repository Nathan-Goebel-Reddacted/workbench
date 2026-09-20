import { useEffect, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useShowPopup } from '@atelier/shared-ui'
import { PageShell } from '../../../shared/components/PageShell'
import { Async } from '../../../shared/components/PageStatus'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import { PublishedPage } from '../../content-editor'
import type { PublishedProject } from '../types'
import { usePublishedProject } from '../hooks/usePublishedProject'
import { NO_PAGE_MESSAGE } from '../labels'

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const { project, status, retry } = usePublishedProject(id)

  useDocumentTitle(project?.name)

  return (
    <Async status={status} onRetry={retry}>
      {() =>
        project && project.destination.kind !== 'page' ? (
          <ElsewhereRedirect destination={project.destination} />
        ) : project ? (
          <PublishedPage
            pageType="project"
            pageRef={project.id}
            blank={
              <PageShell>
                <h1 style={titleStyle}>{project.name}</h1>
              </PageShell>
            }
          />
        ) : (
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
    </Async>
  )
}

function ElsewhereRedirect({ destination }: { destination: PublishedProject['destination'] }) {
  const showPopup = useShowPopup()

  useEffect(() => {
    if (destination.kind === 'external') window.location.replace(destination.url)
    else showPopup(NO_PAGE_MESSAGE)
  }, [destination, showPopup])

  if (destination.kind === 'external') return null
  return <Navigate to="/projects" replace />
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
