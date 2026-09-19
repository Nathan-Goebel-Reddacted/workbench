import { useState, type CSSProperties } from 'react'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import type { SectionType } from '../widgets'
import { getWidgetsByCategory } from './widgetCatalog'

type ComponentPaletteProps = {
  allowedTypes: readonly SectionType[]
  onAdd: (type: SectionType) => void
}

export function ComponentPalette({ allowedTypes, onAdd }: ComponentPaletteProps) {
  const canEdit = useCanEdit()
  const [open, setOpen] = useState(true)
  const groups = getWidgetsByCategory(allowedTypes)

  return (
    <div style={{ ...paletteStyle, width: open ? '200px' : '44px' }}>
      <div style={headerStyle}>
        {open && <span style={headerTitleStyle}>Components</span>}
        <button style={toggleStyle} onClick={() => setOpen(o => !o)} title={open ? 'Collapse' : 'Components'}>
          {open ? '‹' : '›'}
        </button>
      </div>
      {open && (
        <div style={contentStyle}>
          {groups.map(group => (
            <div key={group.category} style={groupStyle}>
              <span style={groupTitleStyle}>{group.category}</span>
              {group.widgets.map(widget => (
                <button key={widget.type} style={itemStyle} disabled={!canEdit} onClick={() => onAdd(widget.type)}>
                  {widget.icon} {widget.label}
                </button>
              ))}
            </div>
          ))}
          {!canEdit && <p style={mutedStyle}>Edit role required to change the page.</p>}
        </div>
      )}
    </div>
  )
}

const paletteStyle: CSSProperties = {
  flexShrink: 0,
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  transition: 'width 150ms ease',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  height: '44px',
  padding: '0 0.5rem 0 1rem',
  borderBottom: '1px solid var(--color-border)',
}

const headerTitleStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}

const toggleStyle: CSSProperties = {
  width: '28px',
  height: '28px',
  flexShrink: 0,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  color: 'var(--color-text-muted)',
}

const contentStyle: CSSProperties = {
  padding: '1rem',
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
}

const groupStyle: CSSProperties = {
  marginBottom: '1rem',
}

const groupTitleStyle: CSSProperties = {
  display: 'block',
  marginBottom: '0.375rem',
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}

const itemStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '0.5rem 0.75rem',
  marginBottom: '0.375rem',
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '999px',
  cursor: 'pointer',
  textAlign: 'center',
}

const mutedStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
