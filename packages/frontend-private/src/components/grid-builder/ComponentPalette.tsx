import { useState, type CSSProperties } from 'react'
import { useCanEdit } from '../../contexts/EditPermissionContext'
import { getWidgetsByCategory, type PageType, type Widget } from './widgets'

type ComponentPaletteProps = {
  pageType: PageType
  onAdd: (widget: Widget) => void
}

export function ComponentPalette({ pageType, onAdd }: ComponentPaletteProps) {
  const canEdit = useCanEdit()
  const [open, setOpen] = useState(true)
  const groups = getWidgetsByCategory(pageType)

  return (
    <div style={{ ...paletteStyle, width: open ? '200px' : '44px' }}>
      <div style={headerStyle}>
        {open && <span style={headerTitleStyle}>Composants</span>}
        <button style={toggleStyle} onClick={() => setOpen(o => !o)} title={open ? 'Réduire' : 'Composants'}>
          {open ? '‹' : '›'}
        </button>
      </div>
      {open && (
        <div style={contentStyle}>
          {groups.map(group => (
            <div key={group.category} style={groupStyle}>
              <span style={groupTitleStyle}>{group.category}</span>
              {group.widgets.map(widget => (
                <button key={widget.key} style={itemStyle} disabled={!canEdit} onClick={() => onAdd(widget)}>
                  {widget.icon} {widget.label}
                </button>
              ))}
            </div>
          ))}
          {!canEdit && <p style={mutedStyle}>Rôle edit requis pour modifier la page.</p>}
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
