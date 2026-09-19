import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../../../shared/components/FileUpload'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { useCvs } from '../hooks/useCvs'
import type { Cv } from '../types'
import { uploadUrl } from '../../../shared/config'

export function CvPage() {
  const canEdit = useCanEdit()
  const { cvs, loading, error, move, toggleVisibility, remove, create } = useCvs()
  const [preview, setPreview] = useState<{ cv: Cv; x: number; y: number } | null>(null)

  const [newName, setNewName] = useState('')
  const [newFileUrl, setNewFileUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    const hide = () => setPreview(null)
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [])

  const showPreview = (cv: Cv, e: React.MouseEvent) => {
    setPreview({ cv, ...previewPosition(e.clientX, e.clientY) })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    void move(String(active.id), String(over.id))
  }

  const handleDelete = async (cv: Cv) => {
    if (!window.confirm(`Delete the CV “${cv.name}”?`)) return
    if (await remove(cv)) setPreview(current => (current?.cv.id === cv.id ? null : current))
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      if (await create(newName, newFileUrl)) {
        setNewName('')
        setNewFileUrl('')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>CV</h1>
      <p style={hintStyle}>
        CVs are PDFs. The list order is the one used on the public site; hovering a name previews it, clicking opens it.
      </p>

      {error && <p style={errorStyle}>{error}</p>}
      {loading && <p style={hintStyle}>Loading…</p>}

      {!loading && (
        <div style={listStyle}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cvs.map(cv => cv.id)} strategy={verticalListSortingStrategy}>
              {cvs.map(cv => (
                <CvRow
                  key={cv.id}
                  cv={cv}
                  canEdit={canEdit}
                  onToggle={() => toggleVisibility(cv)}
                  onDelete={() => handleDelete(cv)}
                  onPreview={e => showPreview(cv, e)}
                  onPreviewEnd={() => setPreview(null)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {cvs.length === 0 && <p style={hintStyle}>No CV yet.</p>}

          {canEdit && (
            <div style={{ ...rowStyle, ...formRowStyle }}>
              <span style={handleStyle} aria-hidden="true" />
              <span aria-hidden="true" />
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="CV name — e.g. Full Stack Dev FR"
                style={inputStyle}
              />
              <FileUpload
                accept="application/pdf"
                label={newFileUrl ? 'PDF chosen' : 'Choose a PDF'}
                onUploaded={url => setNewFileUrl(url)}
              />
              <Button onClick={handleCreate} disabled={saving || !newName.trim() || !newFileUrl}>
                Save
              </Button>
            </div>
          )}
        </div>
      )}

      {preview && <CvPreviewTooltip cv={preview.cv} x={preview.x} y={preview.y} />}
    </div>
  )
}

type CvRowProps = {
  cv: Cv
  canEdit: boolean
  onToggle: () => void
  onDelete: () => void
  onPreview: (e: React.MouseEvent) => void
  onPreviewEnd: () => void
}

function CvRow({ cv, canEdit, onToggle, onDelete, onPreview, onPreviewEnd }: CvRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cv.id,
    disabled: !canEdit,
  })

  const style: CSSProperties = {
    ...rowStyle,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <span
        style={{ ...handleStyle, cursor: canEdit ? 'grab' : 'default' }}
        {...(canEdit ? { ...attributes, ...listeners } : {})}
        aria-label="Reorder"
      >
        ⠿
      </span>

      <VisibilitySwitch visible={cv.visible} enabled={canEdit} onToggle={onToggle} />

      <span style={nameCellStyle}>
        <a
          href={uploadUrl(cv.fileUrl)}
          target="_blank"
          rel="noopener noreferrer"
          style={nameStyle}
          onMouseEnter={onPreview}
          onMouseLeave={onPreviewEnd}
        >
          {cv.name}
        </a>
      </span>

      {canEdit && (
        <Button variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      )}
    </div>
  )
}

const PREVIEW_WIDTH = 460
const PREVIEW_HEIGHT = 620
const PREVIEW_GAP = 16

function previewPosition(cursorX: number, cursorY: number): { x: number; y: number } {
  const fitsRight = cursorX + PREVIEW_GAP + PREVIEW_WIDTH <= window.innerWidth
  const x = fitsRight ? cursorX + PREVIEW_GAP : Math.max(PREVIEW_GAP, cursorX - PREVIEW_GAP - PREVIEW_WIDTH)
  const maxY = window.innerHeight - PREVIEW_HEIGHT - PREVIEW_GAP
  const y = Math.max(PREVIEW_GAP, Math.min(cursorY - PREVIEW_HEIGHT / 3, maxY))
  return { x, y }
}

function CvPreviewTooltip({ cv, x, y }: { cv: Cv; x: number; y: number }) {
  return (
    <div style={{ ...tooltipStyle, top: y, left: x }}>
      <iframe
        src={`${uploadUrl(cv.fileUrl)}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit`}
        title={cv.name}
        style={tooltipFrameStyle}
      />
    </div>
  )
}

function VisibilitySwitch({
  visible,
  enabled,
  onToggle,
}: {
  visible: boolean
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={visible}
      aria-label="Show on the public site"
      title={visible ? 'Shown' : 'Hidden'}
      disabled={!enabled}
      onClick={onToggle}
      style={{
        ...switchTrackStyle,
        backgroundColor: visible ? 'var(--color-primary)' : 'var(--color-border)',
        opacity: enabled ? 1 : 0.5,
        cursor: enabled ? 'pointer' : 'not-allowed',
      }}
    >
      <span
        style={{
          ...switchThumbStyle,
          transform: visible ? 'translateX(14px)' : 'translateX(2px)',
        }}
      />
    </button>
  )
}

const switchTrackStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  flexShrink: 0,
  width: '30px',
  height: '18px',
  borderRadius: '9px',
  border: 'none',
  padding: 0,
  transition: 'background-color 0.2s',
}

const switchThumbStyle: CSSProperties = {
  position: 'absolute',
  top: '2px',
  left: 0,
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-surface)',
  transition: 'transform 0.2s',
}

const pageStyle: CSSProperties = {
  padding: '2rem',
  maxWidth: '900px',
  margin: '0 auto',
  width: '100%',
  color: 'var(--color-text)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--color-text)',
}

const hintStyle: CSSProperties = {
  marginTop: '0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
}

const errorStyle: CSSProperties = {
  marginTop: '0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-primary)',
}

const listStyle: CSSProperties = {
  marginTop: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.625rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  backgroundColor: 'var(--color-surface)',
}

const formRowStyle: CSSProperties = {
  borderStyle: 'dashed',
}

const handleStyle: CSSProperties = {
  width: '1rem',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  userSelect: 'none',
}

const nameCellStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const nameStyle: CSSProperties = {
  color: 'var(--color-text)',
  fontSize: '0.9375rem',
  textDecoration: 'underline dotted',
  textDecorationColor: 'var(--color-text-muted)',
}

const tooltipStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  width: `${PREVIEW_WIDTH}px`,
  height: `${PREVIEW_HEIGHT}px`,
  padding: '0.5rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  pointerEvents: 'none',
}

const tooltipFrameStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: 'var(--color-bg)',
}

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.625rem',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
}
