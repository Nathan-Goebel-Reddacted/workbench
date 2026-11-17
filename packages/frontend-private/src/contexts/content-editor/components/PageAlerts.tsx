import type { CSSProperties } from 'react'
import type { PageElement } from '@content'
import { COMPONENT_KINDS, COMPONENT_REGISTRY } from './componentRegistry'
import { issueMessage } from './inspector/ElementInspector'

type Props = {
  elements: readonly PageElement[]
  clipped: ReadonlySet<string>
  onSelect: (elementId: string) => void
}

export function flaggedElements(elements: readonly PageElement[], clipped: ReadonlySet<string>): PageElement[] {
  return elements.filter(element => clipped.has(element.id) || (element.issues?.length ?? 0) > 0)
}

function labelOf(element: PageElement): string {
  const content = COMPONENT_KINDS.find(kind => element.components[kind] && COMPONENT_REGISTRY[kind].render)
  return content ? COMPONENT_REGISTRY[content].label : 'Empty element'
}

function problemsOf(element: PageElement, clipped: boolean): string[] {
  return [...(clipped ? ['Content cut by its box.'] : []), ...(element.issues ?? []).map(issueMessage)]
}

export function PageAlerts({ elements, clipped, onSelect }: Props) {
  const flagged = flaggedElements(elements, clipped)
  if (flagged.length === 0) return null

  return (
    <section style={alertStyle} onPointerDown={event => event.stopPropagation()}>
      <h2 style={titleStyle}>
        {flagged.length === 1 ? '1 element needs attention' : `${flagged.length} elements need attention`}
      </h2>
      <ul style={listStyle}>
        {flagged.map(element => (
          <li key={element.id}>
            <button type="button" style={itemStyle} onClick={() => onSelect(element.id)}>
              <strong style={labelStyle}>{labelOf(element)}</strong>
              <span>{problemsOf(element, clipped.has(element.id)).join(' ')}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

const alertStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-primary)',
  borderRadius: '6px',
}
const titleStyle: CSSProperties = { margin: 0, fontSize: '0.875rem', color: 'var(--color-text)' }
const listStyle: CSSProperties = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }
const itemStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  width: '100%',
  padding: '0.25rem 0',
  textAlign: 'left',
  fontSize: '0.8125rem',
  color: 'var(--color-text-muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
}
const labelStyle: CSSProperties = { color: 'var(--color-text)', flexShrink: 0 }
