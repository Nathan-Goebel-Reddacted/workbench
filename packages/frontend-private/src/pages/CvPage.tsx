import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from './project-detail/FileUpload'
import { useCanEdit } from '../contexts/EditPermissionContext'
import { resolveUploadUrl } from '@atelier/content-renderer'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type Cv = {
  id: string
  name: string
  fileUrl: string
  visible: boolean
  displayOrder: number
  createdAt: string
}

export function CvPage() {
  const canEdit = useCanEdit()
  const [cvs, setCvs] = useState<Cv[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ cv: Cv; x: number; y: number } | null>(null)

  const [newName, setNewName] = useState('')
  const [newFileUrl, setNewFileUrl] = useState('')
  const [newVisible, setNewVisible] = useState(true)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const fetchCvs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/cvs`, { credentials: 'include', signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setCvs((await res.json()) as Cv[])
    } catch {
      if (signal?.aborted) return
      setError('Impossible de charger les CVs.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchCvs(controller.signal)
    return () => controller.abort()
  }, [fetchCvs])

  useEffect(() => {
    const hide = () => setPreview(null)
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [])

  const showPreview = (cv: Cv, e: React.MouseEvent) => {
    setPreview({ cv, ...previewPosition(e.clientX, e.clientY) })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const from = cvs.findIndex(cv => cv.id === active.id)
    const to = cvs.findIndex(cv => cv.id === over.id)
    if (from === -1 || to === -1) return

    const previous = cvs
    const reordered = arrayMove(cvs, from, to)
    setCvs(reordered)

    const res = await fetch(`${API_URL}/cvs/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: reordered.map(cv => cv.id) }),
    })
    if (!res.ok && res.status !== 204) {
      setCvs(previous)
      setError("Impossible d'enregistrer le nouvel ordre.")
    }
  }

  const handleToggle = async (cv: Cv) => {
    const visible = !cv.visible
    setCvs(prev => prev.map(c => (c.id === cv.id ? { ...c, visible } : c)))
    const res = await fetch(`${API_URL}/cvs/${cv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ visible }),
    })
    if (!res.ok && res.status !== 204) {
      setCvs(prev => prev.map(c => (c.id === cv.id ? { ...c, visible: cv.visible } : c)))
      setError("Impossible de changer l'affichage.")
    }
  }

  const handleDelete = async (cv: Cv) => {
    if (!window.confirm(`Supprimer le CV « ${cv.name} » ?`)) return
    const res = await fetch(`${API_URL}/cvs/${cv.id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok || res.status === 204) {
      setCvs(prev => prev.filter(c => c.id !== cv.id))
      setPreview(current => (current?.cv.id === cv.id ? null : current))
    } else {
      setError('Erreur lors de la suppression.')
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newFileUrl) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/cvs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName.trim(), fileUrl: newFileUrl }),
      })
      if (res.status !== 201) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setError(body?.error ?? "Erreur lors de l'enregistrement.")
        return
      }
      const { id } = (await res.json()) as { id: string }

      if (!newVisible) {
        await fetch(`${API_URL}/cvs/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ visible: false }),
        })
      }

      setNewName('')
      setNewFileUrl('')
      setNewVisible(true)
      setError(null)
      await fetchCvs()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>CV</h1>
      <p style={hintStyle}>
        Les CVs sont des PDFs. L'ordre de la liste est celui du site public ; le survol d'un nom en montre un aperçu, le
        clic l'ouvre.
      </p>

      {error && <p style={errorStyle}>{error}</p>}
      {loading && <p style={hintStyle}>Chargement…</p>}

      {!loading && (
        <div style={listStyle}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cvs.map(cv => cv.id)} strategy={verticalListSortingStrategy}>
              {cvs.map(cv => (
                <CvRow
                  key={cv.id}
                  cv={cv}
                  canEdit={canEdit}
                  onToggle={() => handleToggle(cv)}
                  onDelete={() => handleDelete(cv)}
                  onPreview={e => showPreview(cv, e)}
                  onPreviewEnd={() => setPreview(null)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {cvs.length === 0 && <p style={hintStyle}>Aucun CV pour l'instant.</p>}

          {canEdit && (
            <div style={{ ...rowStyle, ...formRowStyle }}>
              <span style={handleStyle} aria-hidden="true" />
              <VisibilitySwitch visible={newVisible} enabled onToggle={() => setNewVisible(v => !v)} />
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nom du CV — ex. Dev Full Stack FR"
                style={inputStyle}
              />
              <FileUpload
                apiUrl={API_URL}
                accept="application/pdf"
                label={newFileUrl ? 'PDF choisi' : 'Choisir un PDF'}
                onUploaded={url => setNewFileUrl(url)}
              />
              <Button onClick={handleCreate} disabled={saving || !newName.trim() || !newFileUrl}>
                Enregistrer
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
        aria-label="Réordonner"
      >
        ⠿
      </span>

      <VisibilitySwitch visible={cv.visible} enabled={canEdit} onToggle={onToggle} />

      <span style={nameCellStyle}>
        <a
          href={resolveUploadUrl(cv.fileUrl, API_URL)}
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
          Supprimer
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
        src={`${resolveUploadUrl(cv.fileUrl, API_URL)}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit`}
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
      aria-label="Afficher sur le site public"
      title={visible ? 'Affiché' : 'Masqué'}
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
