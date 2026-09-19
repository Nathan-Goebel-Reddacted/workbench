import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../../../shared/components/FileUpload'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import {
  PreviewTooltip,
  isPreviewable,
  previewKind,
  previewableLabelStyle,
  usePreview,
} from '../../../shared/resource/documentPreview'
import { useDocuments } from '../../../shared/resource/useDocuments'
import { useTicket } from '../hooks/useTicket'
import type { Ticket, TicketNote } from '../types'
import { uploadUrl } from '../../../shared/config'

export function TicketModal({
  ticket,
  onClose,
  onUpdate,
  onDelete,
}: {
  ticket: Ticket
  onClose: () => void
  onUpdate: (updated: Partial<Ticket>) => void
  onDelete: () => void
}) {
  const canEdit = useCanEdit()
  const [title, setTitle] = useState(ticket.title)
  const [description, setDescription] = useState(ticket.description)
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const {
    documents: documentStore,
    saving,
    deleting,
    error,
    save,
    remove,
    addNote,
    editNote,
  } = useTicket(ticket, onUpdate)
  const {
    documents: docs,
    error: docError,
    add: addDocument,
    remove: removeDocument,
  } = useDocuments(documentStore, ticket.documents, documents => onUpdate({ documents }))
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const preview = usePreview()
  const notes = ticket.notes

  const handleAddDoc = async () => {
    if (!(await addDocument(docName, docUrl))) return
    setDocName('')
    setDocUrl('')
  }

  const handleSave = async () => {
    if (await save({ title, description })) onClose()
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    if (await addNote(newNote)) setNewNote('')
  }

  const handleDelete = async () => {
    if (!(await remove())) return
    onDelete()
    onClose()
  }

  const handleEditNote = (note: TicketNote) => {
    setEditingId(note.id)
    setEditingValue(note.text)
  }

  const handleSaveNote = async (noteId: string) => {
    if (!editingValue.trim()) return
    if (await editNote(noteId, editingValue)) setEditingId(null)
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <span style={modalTitleStyle}>
            {ticket.reference} — {ticket.title}
          </span>
          <button style={closeButtonStyle} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <p style={docErrorStyle}>{error}</p>}

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            readOnly={!canEdit}
            style={{ ...modalInputStyle, cursor: canEdit ? 'text' : 'default' }}
          />
        </div>

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            readOnly={!canEdit}
            style={{ ...modalInputStyle, resize: canEdit ? 'vertical' : 'none', cursor: canEdit ? 'text' : 'default' }}
          />
        </div>

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Notes</label>
          {notes.length > 0 && (
            <ul style={notesListStyle}>
              {notes.map(n => (
                <li key={n.id} style={noteItemStyle}>
                  {editingId === n.id ? (
                    <div style={noteEditRowStyle}>
                      <input
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveNote(n.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        style={{ ...modalInputStyle, flex: 1 }}
                        autoFocus
                      />
                      <Button variant="primary" onClick={() => handleSaveNote(n.id)}>
                        OK
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingId(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div style={noteEditRowStyle}>
                      <span style={noteStyle}>{n.text}</span>
                      <button
                        style={editNoteButtonStyle}
                        onClick={() => canEdit && handleEditNote(n)}
                        disabled={!canEdit}
                        title="Edit"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div style={noteAddStyle}>
            <input
              placeholder="Add a note…"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canEdit && handleAddNote()}
              disabled={!canEdit}
              style={modalInputStyle}
            />
            <Button variant="ghost" onClick={handleAddNote} disabled={!canEdit}>
              Add
            </Button>
          </div>
        </div>

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Documents</label>
          {docError && <p style={docErrorStyle}>{docError}</p>}
          {docs.length === 0 ? (
            <p style={mutedStyle}>No document.</p>
          ) : (
            <ul style={notesListStyle}>
              {docs.map(d => (
                <li key={d.id} style={docItemStyle}>
                  <a
                    href={uploadUrl(d.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...docNameStyle, ...(isPreviewable(previewKind(d.url)) ? previewableLabelStyle : {}) }}
                    onMouseEnter={isPreviewable(previewKind(d.url)) ? e => preview.show(d.url, e) : undefined}
                    onMouseLeave={isPreviewable(previewKind(d.url)) ? preview.hide : undefined}
                  >
                    {d.name}
                  </a>
                  <Button variant="ghost" onClick={() => removeDocument(d.id)} disabled={!canEdit}>
                    ✕
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div style={docAddStyle}>
            <input
              placeholder="Name"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              disabled={!canEdit}
              style={{ ...modalInputStyle, flex: 1 }}
            />
            <input
              placeholder="URL"
              value={docUrl}
              onChange={e => setDocUrl(e.target.value)}
              disabled={!canEdit}
              style={{ ...modalInputStyle, flex: 2 }}
            />
            <FileUpload
              label="📁"
              onUploaded={(url, filename) => {
                setDocUrl(url)
                if (!docName.trim()) setDocName(filename)
              }}
              disabled={!canEdit}
            />
            <Button variant="ghost" onClick={handleAddDoc} disabled={!canEdit}>
              Add
            </Button>
          </div>
        </div>

        <div style={modalActionsStyle}>
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={!canEdit || deleting}
            style={{ color: 'var(--color-primary)', marginRight: 'auto' }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canEdit || saving || !title.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      <PreviewTooltip state={preview.state} onMouseEnter={preview.keep} onMouseLeave={preview.hide} />
    </div>
  )
}

const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }
const notesListStyle: CSSProperties = { margin: '0 0 0.5rem', paddingLeft: '0', listStyle: 'none' }
const noteStyle: CSSProperties = { fontSize: '0.8rem', color: 'var(--color-text-muted)', flex: 1 }
const noteItemStyle: CSSProperties = { marginBottom: '0.375rem' }
const noteEditRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' }
const editNoteButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  padding: '0.125rem 0.25rem',
  opacity: 0.6,
  lineHeight: 1,
}
const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backdropFilter: 'brightness(0.45) blur(2px)',
  WebkitBackdropFilter: 'brightness(0.45) blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}
const modalStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.5rem',
  width: '480px',
  maxWidth: '90vw',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}
const modalHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const modalTitleStyle: CSSProperties = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }
const modalLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.375rem',
  display: 'block',
}
const modalFieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column' }
const modalInputStyle: CSSProperties = {
  padding: '0.4rem 0.6rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
const noteAddStyle: CSSProperties = { display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }
const modalActionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  paddingTop: '0.5rem',
  borderTop: '1px solid var(--color-border)',
}
const closeButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  color: 'var(--color-text-muted)',
  padding: '0.25rem',
  lineHeight: 1,
}
const docErrorStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-primary)', margin: '0 0 0.375rem' }
const docItemStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }
const docNameStyle: CSSProperties = {
  flex: 1,
  fontSize: '0.8rem',
  color: 'var(--color-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
}
const docAddStyle: CSSProperties = { display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.375rem' }
