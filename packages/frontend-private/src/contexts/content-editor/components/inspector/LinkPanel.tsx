import { useState, type CSSProperties } from 'react'
import type { LinkComponent } from '@content'
import { useBindableProjects } from '../../hooks/useBindables'
import type { PanelProps } from './panelProps'

type Target = 'url' | 'project'

export function LinkPanel({ value, onChange }: PanelProps<'link'>) {
  const { projects } = useBindableProjects()
  const [target, setTarget] = useState<Target>(value.projectId ? 'project' : 'url')
  const [url, setUrl] = useState(value.url ?? '')

  const save = (next: Partial<LinkComponent>) => onChange({ ...value, ...next })
  const commitUrl = () => {
    const trimmed = url.trim()
    if (trimmed !== (value.url ?? '')) save({ url: trimmed === '' ? null : trimmed, projectId: null })
  }

  return (
    <div style={panelStyle}>
      <div style={choiceStyle} role="radiogroup" aria-label="Link target">
        {(['url', 'project'] as const).map(option => (
          <label key={option} style={radioStyle}>
            <input type="radio" name="link-target" checked={target === option} onChange={() => setTarget(option)} />
            {option === 'url' ? 'Web address' : 'Project'}
          </label>
        ))}
      </div>

      {target === 'url' ? (
        <label style={fieldStyle}>
          <span style={labelStyle}>Address</span>
          <input
            type="url"
            style={inputStyle}
            placeholder="https://… or /projects, /cv, /"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={e => {
              if (e.key === 'Enter') commitUrl()
            }}
          />
        </label>
      ) : (
        <label style={fieldStyle}>
          <span style={labelStyle}>Project</span>
          <select
            style={inputStyle}
            value={value.projectId ?? ''}
            onChange={e => save({ projectId: e.target.value === '' ? null : e.target.value, url: null })}
          >
            <option value="">No project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {value.projectId && value.destination?.kind === 'none' && (
            <span style={hintStyle}>This project has no public destination: the link is inactive.</span>
          )}
        </label>
      )}

      <label style={radioStyle}>
        <input type="checkbox" checked={value.newTab} onChange={e => save({ newTab: e.target.checked })} />
        Open in a new tab
      </label>
    </div>
  )
}

const panelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }
const choiceStyle: CSSProperties = { display: 'flex', gap: '1rem' }
const radioStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
}
const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
const hintStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
const inputStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
}
