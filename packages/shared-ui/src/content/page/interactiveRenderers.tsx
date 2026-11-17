import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { resolveUploadUrl } from '../media/documentKind'
import { ContactForm } from '../section/ContactForm'
import { cssColor } from './color'
import { linkHref } from './linkHref'
import type { ContactFormComponent, ProjectCardComponent } from './pageTypes'

export const EditingContext = createContext(false)

export function ProjectCardView({ projectId, project }: ProjectCardComponent) {
  const apiUrl = useApiUrl()
  if (!projectId || !project) return null

  const href = linkHref({ url: null, projectId, newTab: false, destination: project.destination }, apiUrl)
  const external = project.destination.kind === 'external'
  const body: ReactNode = (
    <>
      {project.image && <img src={resolveUploadUrl(project.image, apiUrl)} alt="" style={imageStyle} />}
      <span style={titleStyle}>{project.name}</span>
      {project.description && <span style={descriptionStyle}>{project.description}</span>}
    </>
  )

  if (!href) return <div style={cardStyle}>{body}</div>
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={cardStyle}
    >
      {body}
    </a>
  )
}

export function ContactFormView(form: ContactFormComponent) {
  const editing = useContext(EditingContext)
  return (
    <ContactForm
      content={form}
      mode={editing ? 'edit' : 'public'}
      colors={{
        text: cssColor(form.textColor, 'var(--color-text)'),
        button: cssColor(form.buttonColor, 'var(--color-primary)'),
      }}
    />
  )
}

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  height: '100%',
  textDecoration: 'none',
  color: 'var(--color-text)',
}
const imageStyle: CSSProperties = { width: '100%', flex: 1, minHeight: 0, objectFit: 'cover' }
const titleStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const descriptionStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
