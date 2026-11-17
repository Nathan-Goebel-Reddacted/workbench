import type { CSSProperties } from 'react'
import { Button, ConfirmDeleteButton } from '@atelier/shared-ui'
import type { ComponentKind, ElementComponents, PageElement } from '@content'
import type { ReorderDirection } from '../../types'
import { COMPONENT_KINDS, COMPONENT_REGISTRY } from '../componentRegistry'

type Props = {
  element: PageElement
  onSet: (kind: ComponentKind, value: object) => void
  onUnset: (kind: ComponentKind) => void
  onDelete: () => void
  onDuplicate: () => void
  onReorder: (direction: ReorderDirection) => void
  beginInteraction: () => () => void
}

export function ElementInspector(props: Props) {
  const { element, onSet, onUnset, onDelete, onDuplicate, onReorder, beginInteraction } = props
  const present = COMPONENT_KINDS.filter(kind => element.components[kind])
  const absent = COMPONENT_KINDS.filter(kind => !element.components[kind])
  const issues = element.issues ?? []

  return (
    <aside style={inspectorStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>Element</h2>
        <ConfirmDeleteButton onConfirm={onDelete} label="Delete" confirmLabel="Confirm" />
      </header>
      <div style={addRowStyle}>
        <Button variant="secondary" onClick={onDuplicate}>
          Duplicate
        </Button>
        <Button variant="ghost" onClick={() => onReorder('forward')}>
          Bring forward
        </Button>
        <Button variant="ghost" onClick={() => onReorder('backward')}>
          Send backward
        </Button>
      </div>

      {issues.length > 0 && (
        <ul style={issuesStyle}>
          {issues.map(issue =>
            issue.kind === 'missingFile' ? (
              <li key={issue.url}>Missing file, hidden on the public page: {issue.url}</li>
            ) : (
              <li key={issue.projectId}>This project is private or deleted: hidden or inactive on the public page.</li>
            ),
          )}
        </ul>
      )}

      {present.map(kind => (
        <section key={`${element.id}-${kind}`} style={sectionStyle}>
          <header style={headerStyle}>
            <h3 style={subtitleStyle}>{COMPONENT_REGISTRY[kind].label}</h3>
            <Button variant="ghost" onClick={() => onUnset(kind)}>
              Remove
            </Button>
          </header>
          <ComponentPanel
            kind={kind}
            components={element.components}
            onChange={value => onSet(kind, value)}
            beginInteraction={beginInteraction}
          />
        </section>
      ))}

      {absent.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={subtitleStyle}>Add</h3>
          <div style={addRowStyle}>
            {absent.map(kind => (
              <Button key={kind} variant="secondary" onClick={() => onSet(kind, {})}>
                {COMPONENT_REGISTRY[kind].label}
              </Button>
            ))}
          </div>
        </section>
      )}
    </aside>
  )
}

function ComponentPanel<K extends ComponentKind>({
  kind,
  components,
  onChange,
  beginInteraction,
}: {
  kind: K
  components: ElementComponents
  onChange: (value: object) => void
  beginInteraction: () => () => void
}) {
  const value = components[kind]
  if (!value) return null
  const { Inspector } = COMPONENT_REGISTRY[kind]
  return <Inspector value={value} onChange={onChange} beginInteraction={beginInteraction} />
}

const inspectorStyle: CSSProperties = {
  width: '380px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1rem',
  overflowY: 'auto',
  backgroundColor: 'var(--color-surface)',
  borderLeft: '1px solid var(--color-border)',
}
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const titleStyle: CSSProperties = { margin: 0, fontSize: '1rem', color: 'var(--color-text)' }
const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }
const issuesStyle: CSSProperties = {
  margin: 0,
  padding: '0.5rem 0.75rem 0.5rem 1.5rem',
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  border: '1px solid var(--color-primary)',
  borderRadius: '6px',
}
const addRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }
