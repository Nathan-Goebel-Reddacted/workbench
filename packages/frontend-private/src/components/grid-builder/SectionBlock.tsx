import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useCanEdit } from '../../contexts/EditPermissionContext'
import { WidgetEditorModal } from './WidgetEditorModal'
import { readBackgroundContent, backgroundColorForDepth, type SectionDto } from '@atelier/content-renderer'
import type { SectionContent } from './widgets'

type SectionBlockProps = {
  section: SectionDto
  apiUrl: string
  backgroundDepth?: number
  onRemove: (sectionId: string) => void
  onUpdateContent: (sectionId: string, content: SectionContent, contentRef: string | null) => void
}

export function SectionBlock({ section, apiUrl, backgroundDepth, onRemove, onUpdateContent }: SectionBlockProps) {
  const canEdit = useCanEdit()
  const [editing, setEditing] = useState(false)

  // Le widget fond est décoratif : il s'affiche tel qu'il sera rendu, sans le cadre
  // ni le libellé de type des autres widgets.
  const isBackground = section.type === 'background'
  const { radius, border } = readBackgroundContent(section.content)

  const style: CSSProperties = isBackground
    ? {
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        backgroundColor: backgroundColorForDepth(backgroundDepth ?? 0),
        borderRadius: `${radius}px`,
        border: border ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
      }
    : cardStyle

  return (
    <div style={style}>
      {canEdit && (
        <div style={headerStyle}>
          <div style={actionsStyle}>
            <button
              style={iconButtonStyle}
              onPointerDown={e => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={() => setEditing(true)}
              title="Éditer"
            >
              ✎
            </button>
            <button
              style={iconButtonStyle}
              onPointerDown={e => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={() => onRemove(section.id)}
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {!isBackground && (
        <div style={placeholderStyle}>
          <span style={placeholderLabelStyle}>{section.type}</span>
        </div>
      )}

      {editing && (
        <WidgetEditorModal
          section={section}
          apiUrl={apiUrl}
          onSave={(content, contentRef) => onUpdateContent(section.id, content, contentRef)}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}

const cardStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  padding: '0.5rem 0.625rem',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  boxSizing: 'border-box',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }

const actionsStyle: CSSProperties = { display: 'flex', gap: '0.125rem' }

const placeholderStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

const placeholderLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const iconButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  padding: '0.125rem 0.25rem',
  lineHeight: 1,
}
