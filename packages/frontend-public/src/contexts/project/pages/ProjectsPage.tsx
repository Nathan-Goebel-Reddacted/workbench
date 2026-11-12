import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../../../shared/components/PageShell'
import { Async } from '../../../shared/components/PageStatus'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import { groupByCategory, type Section } from '../sections'
import type { ProjectSummary } from '../types'
import { usePublishedProjects } from '../hooks/usePublishedProjects'

export function ProjectsPage() {
  useDocumentTitle('Projets')
  const { projects, status, retry } = usePublishedProjects()

  return (
    <Async status={status} onRetry={retry}>
      {() => <Sections sections={groupByCategory(projects)} />}
    </Async>
  )
}

function Sections({ sections }: { sections: Section[] }) {
  return (
    <PageShell>
      <h1 style={titleStyle}>Projets</h1>

      <div style={gridStyle}>
        {sections.map(section => (
          <section key={section.key} style={sectionStyle}>
            <p style={sectionLabelStyle}>{section.label}</p>
            {section.projects.length === 0 ? (
              <p style={mutedStyle}>Aucun projet.</p>
            ) : (
              <ul style={listStyle}>
                {section.projects.map(p => (
                  <li key={p.id} style={itemStyle}>
                    <ProjectEntry project={p} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </PageShell>
  )
}

function ProjectEntry({ project }: { project: ProjectSummary }) {
  const body = (
    <>
      <span style={itemNameStyle}>{project.name}</span>
      {project.description && <span style={itemDescStyle}>{project.description}</span>}
    </>
  )

  if (project.destination.kind === 'external') {
    return (
      <a href={project.destination.url} target="_blank" rel="noreferrer" style={itemLinkStyle}>
        {body}
      </a>
    )
  }

  if (project.destination.kind === 'none') return <span style={itemUnlinkedStyle}>{body}</span>

  return (
    <Link to={`/projects/${project.id}`} style={itemLinkStyle}>
      {body}
    </Link>
  )
}

const titleStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  margin: '0 0 1.75rem',
}
// auto-fit plutôt qu'un nombre fixe de colonnes : les sections se rangent d'après la place
// disponible — quatre de front sur un écran, une seule sur un téléphone — sans media query.
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
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
const itemUnlinkedStyle: CSSProperties = { ...itemLinkStyle, cursor: 'default' }
const itemNameStyle: CSSProperties = { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }
const itemDescStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
