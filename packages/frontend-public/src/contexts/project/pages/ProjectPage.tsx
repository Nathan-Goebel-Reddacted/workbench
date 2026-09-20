import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageShell } from '../../../shared/components/PageShell'
import { Async } from '../../../shared/components/PageStatus'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import { PublishedPage } from '../../content-editor'
import { usePublishedProject } from '../hooks/usePublishedProject'

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const { project, status, retry } = usePublishedProject(id)

  useDocumentTitle(project?.name)

  return (
    <Async status={status} onRetry={retry}>
      {() =>
        project ? (
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
