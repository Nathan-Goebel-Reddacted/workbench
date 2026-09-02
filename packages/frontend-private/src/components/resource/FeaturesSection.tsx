import type { CSSProperties } from 'react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../../pages/project-detail/FileUpload'
import { useCanEdit } from '../../contexts/EditPermissionContext'
import { resolveUploadUrl } from '@atelier/content-renderer'
import { PreviewTooltip, isPreviewable, previewKind, previewableLabelStyle, usePreview } from './documentPreview'

type Doc = { id: string; name: string; url: string; type: string }

// L'aperçu au survol est mutualisé avec DocumentsSection : voir documentPreview.tsx.

export type OwnerType = 'project' | 'idea'

type TicketDto = {
  id: string
  reference: string
  featureId: string
  title: string
  description: string
  status: string
  /** Vrai quand la feature est portée par une idée : le travail n'a pas démarré. */
  statusLocked: boolean
  notes: string[]
  documents: Doc[]
}
export type FeatureDto = {
  id: string
  ownerType: OwnerType
  ownerId: string
  number: number
  reference: string
  name: string
  description: string
  documents: Doc[]
}

const LOCKED_STATUS_HINT =
  "Une idée n'a pas démarré : ses tickets restent « pending ». Convertis l'idée en projet pour les faire avancer."

const STATUSES = ['pending', 'in_progress', 'finished']

function TicketModal({
  ticket,
  apiUrl,
  onClose,
  onUpdate,
  onDelete,
}: {
  ticket: TicketDto
  apiUrl: string
  onClose: () => void
  onUpdate: (updated: Partial<TicketDto>) => void
  onDelete: () => void
}) {
  const canEdit = useCanEdit()
  const [title, setTitle] = useState(ticket.title)
  const [description, setDescription] = useState(ticket.description)
  const [notes, setNotes] = useState(ticket.notes)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [docs, setDocs] = useState(ticket.documents)
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [docError, setDocError] = useState<string | null>(null)
  const preview = usePreview()

  const inferDocType = (fileUrl: string) => fileUrl.slice(fileUrl.lastIndexOf('.') + 1).toLowerCase() || 'file'

  const handleAddDoc = async () => {
    if (!docName.trim() || !docUrl.trim()) {
      setDocError('Nom et URL requis.')
      return
    }
    setDocError(null)
    const type = inferDocType(docUrl.trim())
    try {
      const res = await fetch(`${apiUrl}/tickets/${ticket.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: docName.trim(), url: docUrl.trim(), type }),
      })
      if (res.ok) {
        const updated = [...docs, { id: crypto.randomUUID(), name: docName.trim(), url: docUrl.trim(), type }]
        setDocs(updated)
        onUpdate({ documents: updated })
        setDocName('')
        setDocUrl('')
      } else {
        setDocError(`Erreur ${res.status} lors de l'ajout.`)
      }
    } catch {
      setDocError("Erreur réseau lors de l'ajout.")
    }
  }

  const handleRemoveDoc = async (docId: string) => {
    const res = await fetch(`${apiUrl}/tickets/${ticket.id}/documents/${docId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok || res.status === 204) {
      const updated = docs.filter(d => d.id !== docId)
      setDocs(updated)
      onUpdate({ documents: updated })
    } else {
      setDocError('Erreur lors de la suppression.')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const res = await fetch(`${apiUrl}/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: title.trim(), description: description.trim() }),
    })
    if (res.ok || res.status === 204) {
      onUpdate({ title: title.trim(), description: description.trim() })
      onClose()
    }
    setSaving(false)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    const res = await fetch(`${apiUrl}/tickets/${ticket.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ note: newNote.trim() }),
    })
    if (res.ok || res.status === 204) {
      const updated = [...notes, newNote.trim()]
      setNotes(updated)
      onUpdate({ notes: updated })
      setNewNote('')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const res = await fetch(`${apiUrl}/tickets/${ticket.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok || res.status === 204) {
      onDelete()
      onClose()
    }
    setDeleting(false)
  }

  const handleEditNote = (index: number) => {
    setEditingIndex(index)
    setEditingValue(notes[index])
  }

  const handleSaveNote = async (index: number) => {
    if (!editingValue.trim()) return
    const res = await fetch(`${apiUrl}/tickets/${ticket.id}/notes/${index}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ note: editingValue.trim() }),
    })
    if (res.ok || res.status === 204) {
      const updated = notes.map((n, i) => (i === index ? editingValue.trim() : n))
      setNotes(updated)
      onUpdate({ notes: updated })
      setEditingIndex(null)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <span style={modalTitleStyle}>
            {ticket.reference} — {ticket.title}
          </span>
          <button style={closeButtonStyle} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Titre</label>
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
              {notes.map((n, i) => (
                <li key={i} style={noteItemStyle}>
                  {editingIndex === i ? (
                    <div style={noteEditRowStyle}>
                      <input
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveNote(i)
                          if (e.key === 'Escape') setEditingIndex(null)
                        }}
                        style={{ ...modalInputStyle, flex: 1 }}
                        autoFocus
                      />
                      <Button variant="primary" onClick={() => handleSaveNote(i)}>
                        OK
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingIndex(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div style={noteEditRowStyle}>
                      <span style={noteStyle}>{n}</span>
                      <button
                        style={editNoteButtonStyle}
                        onClick={() => canEdit && handleEditNote(i)}
                        disabled={!canEdit}
                        title="Modifier"
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
              placeholder="Ajouter une note…"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canEdit && handleAddNote()}
              disabled={!canEdit}
              style={modalInputStyle}
            />
            <Button variant="ghost" onClick={handleAddNote} disabled={!canEdit}>
              Ajouter
            </Button>
          </div>
        </div>

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Documents</label>
          {docError && <p style={docErrorStyle}>{docError}</p>}
          {docs.length === 0 ? (
            <p style={mutedStyle}>Aucun document.</p>
          ) : (
            <ul style={notesListStyle}>
              {docs.map(d => (
                <li key={d.id} style={docItemStyle}>
                  <a
                    href={resolveUploadUrl(d.url, apiUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...docNameStyle, ...(isPreviewable(previewKind(d.url)) ? previewableLabelStyle : {}) }}
                    onMouseEnter={isPreviewable(previewKind(d.url)) ? e => preview.show(d.url, e) : undefined}
                    onMouseLeave={isPreviewable(previewKind(d.url)) ? preview.hide : undefined}
                  >
                    {d.name}
                  </a>
                  <Button variant="ghost" onClick={() => handleRemoveDoc(d.id)} disabled={!canEdit}>
                    ✕
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div style={docAddStyle}>
            <input
              placeholder="Nom"
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
              apiUrl={apiUrl}
              label="📁"
              onUploaded={(url, filename) => {
                setDocUrl(url)
                if (!docName.trim()) setDocName(filename)
              }}
              disabled={!canEdit}
            />
            <Button variant="ghost" onClick={handleAddDoc} disabled={!canEdit}>
              Ajouter
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
            {deleting ? 'Suppression…' : 'Supprimer'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canEdit || saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
      <PreviewTooltip state={preview.state} apiUrl={apiUrl} onMouseEnter={preview.keep} onMouseLeave={preview.hide} />
    </div>
  )
}

function CreateTicketModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (title: string, description: string) => Promise<void>
}) {
  const canEdit = useCanEdit()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !canEdit || submitting) return
    setSubmitting(true)
    await onCreate(title.trim(), description.trim())
    setSubmitting(false)
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <span style={modalTitleStyle}>Nouveau ticket</span>
          <button style={closeButtonStyle} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Titre</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={modalInputStyle}
            autoFocus
          />
        </div>

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            style={{ ...modalInputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={modalActionsStyle}>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canEdit || submitting}>
            {submitting ? 'Création…' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TicketRow({
  ticket,
  apiUrl,
  onStatusChange,
  onUpdate,
  onDelete,
}: {
  ticket: TicketDto
  apiUrl: string
  onStatusChange: (id: string, status: string) => void
  onUpdate: (id: string, updated: Partial<TicketDto>) => void
  onDelete: (id: string) => void
}) {
  const canEdit = useCanEdit()
  const [modalOpen, setModalOpen] = useState(false)

  const handleStatusChange = async (status: string) => {
    const res = await fetch(`${apiUrl}/tickets/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })
    if (res.ok || res.status === 204) onStatusChange(ticket.id, status)
  }

  return (
    <>
      <div
        style={ticketStyle}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setModalOpen(true)}
      >
        <div style={ticketHeaderStyle}>
          <span style={ticketRefStyle}>{ticket.reference}</span>
          <span style={ticketTitleStyle}>{ticket.title}</span>
          <select
            value={ticket.status}
            onClick={e => e.stopPropagation()}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={!canEdit || ticket.statusLocked}
            title={ticket.statusLocked ? LOCKED_STATUS_HINT : undefined}
            style={ticket.statusLocked ? lockedSelectStyle : selectStyle}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {ticket.description && <p style={ticketDescStyle}>{ticket.description}</p>}
        {ticket.notes.length > 0 && (
          <ul style={notesListStyle}>
            {ticket.notes.map((n, i) => (
              <li key={i} style={noteStyle}>
                {n}
              </li>
            ))}
          </ul>
        )}
        {ticket.documents.length > 0 && (
          <ul style={notesListStyle}>
            {ticket.documents.map(d => (
              <li key={d.id} style={noteStyle}>
                <a
                  href={resolveUploadUrl(d.url, apiUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={docInlineLink}
                  onClick={e => e.stopPropagation()}
                >
                  {d.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {modalOpen && (
        <TicketModal
          ticket={ticket}
          apiUrl={apiUrl}
          onClose={() => setModalOpen(false)}
          onUpdate={updated => onUpdate(ticket.id, updated)}
          onDelete={() => onDelete(ticket.id)}
        />
      )}
    </>
  )
}

function FeatureAccordion({
  feature,
  apiUrl,
  onDelete,
}: {
  feature: FeatureDto
  apiUrl: string
  onDelete: (id: string) => void
}) {
  const canEdit = useCanEdit()
  const [open, setOpen] = useState(false)
  const [tickets, setTickets] = useState<TicketDto[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const [name, setName] = useState(feature.name)
  const [description, setDescription] = useState(feature.description)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setLoadingTickets(true)
    fetch(`${apiUrl}/tickets/by-feature/${feature.id}`, { credentials: 'include', signal: controller.signal })
      .then(r => r.json())
      .then((data: TicketDto[]) => {
        setTickets(data)
        setLoadingTickets(false)
      })
      .catch(() => setLoadingTickets(false))
    return () => controller.abort()
  }, [open, feature.id, apiUrl])

  const handleDeleteFeature = async () => {
    // La suppression emporte les tickets : on annonce ce qui part avant de le faire.
    const count = tickets.length
    const warning =
      count > 0
        ? `Supprimer la feature « ${feature.name} » et ses ${count} ticket${count > 1 ? 's' : ''} ?`
        : `Supprimer la feature « ${feature.name} » ?`
    if (!window.confirm(warning)) return
    setDeleting(true)
    const res = await fetch(`${apiUrl}/features/${feature.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok || res.status === 204) onDelete(feature.id)
    setDeleting(false)
  }

  const handleSaveFeature = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`${apiUrl}/features/${feature.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    })
    setSaving(false)
  }

  const handleAddTicket = async (title: string, description: string) => {
    const res = await fetch(`${apiUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ featureId: feature.id, title, description }),
    })
    if (res.status === 201) {
      // La référence est calculée par le serveur : on affiche celle qu'il renvoie plutôt que
      // d'en fabriquer une qui serait fausse jusqu'au prochain rechargement.
      const created = (await res.json()) as TicketDto
      setTickets(prev => [...prev, created])
      setCreateModalOpen(false)
    }
  }

  const handleTicketStatusChange = (id: string, status: string) => {
    setTickets(prev => prev.map(t => (t.id === id ? { ...t, status } : t)))
  }

  const handleTicketUpdate = (id: string, updated: Partial<TicketDto>) => {
    setTickets(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)))
  }

  const handleTicketDelete = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={accordionStyle}>
      <div
        style={accordionHeaderStyle}
        onClick={() => setOpen(o => !o)}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        <span style={chevronStyle}>{open ? '▾' : '▸'}</span>
        {feature.reference && <span style={featureRefStyle}>{feature.reference}</span>}
        <span style={featureNameStyle}>{feature.name}</span>
        <span style={ticketCountStyle}>{open && tickets.length > 0 ? `${tickets.length} tickets` : ''}</span>
      </div>

      {open && (
        <div style={accordionBodyStyle}>
          <div style={featureEditStyle}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              readOnly={!canEdit}
              style={{ ...featureInputStyle, cursor: canEdit ? 'text' : 'default' }}
              placeholder="Feature name"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              readOnly={!canEdit}
              style={{
                ...featureInputStyle,
                resize: canEdit ? 'vertical' : 'none',
                cursor: canEdit ? 'text' : 'default',
              }}
              placeholder="Description"
            />
            <div style={featureActionsStyle}>
              <Button
                variant="ghost"
                onClick={handleDeleteFeature}
                disabled={!canEdit || deleting}
                style={{ color: 'var(--color-primary)' }}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </Button>
              <Button variant="secondary" onClick={handleSaveFeature} disabled={!canEdit || saving}>
                {saving ? 'Saving…' : 'Save feature'}
              </Button>
            </div>
          </div>

          {loadingTickets && <p style={mutedStyle}>Loading tickets…</p>}
          {tickets.map(t => (
            <TicketRow
              key={t.id}
              ticket={t}
              apiUrl={apiUrl}
              onStatusChange={handleTicketStatusChange}
              onUpdate={handleTicketUpdate}
              onDelete={handleTicketDelete}
            />
          ))}

          <Button
            variant="ghost"
            onClick={() => canEdit && setCreateModalOpen(true)}
            disabled={!canEdit}
            style={addTicketBtnStyle}
          >
            + Nouveau ticket
          </Button>

          {createModalOpen && (
            <CreateTicketModal
              onClose={() => setCreateModalOpen(false)}
              onCreate={async (title, description) => {
                await handleAddTicket(title, description)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

type SectionProps = {
  /** Ce qui porte les features : un projet ou une idée. */
  ownerType: OwnerType
  ownerId: string
  initialFeatures: FeatureDto[]
  apiUrl: string
}

export function FeaturesSection({ ownerType, ownerId, initialFeatures, apiUrl }: SectionProps) {
  const canEdit = useCanEdit()
  const [features, setFeatures] = useState<FeatureDto[]>(initialFeatures)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAddFeature = async () => {
    if (!newName.trim()) {
      setError('Le nom est requis.')
      return
    }
    setError(null)
    const res = await fetch(`${apiUrl}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ownerType, ownerId, name: newName.trim(), description: newDesc.trim(), documents: [] }),
    })
    if (res.status === 201) {
      const { id } = (await res.json()) as { id: string }
      // Le numéro et la référence sont attribués par le serveur : on relit la liste plutôt que
      // de deviner la place de la nouvelle feature.
      const listed = await fetch(`${apiUrl}/features/by-owner/${ownerType}/${ownerId}`, { credentials: 'include' })
      if (listed.ok) {
        setFeatures((await listed.json()) as FeatureDto[])
      } else {
        setFeatures(prev => [
          ...prev,
          {
            id,
            ownerType,
            ownerId,
            number: 0,
            reference: '',
            name: newName.trim(),
            description: newDesc.trim(),
            documents: [],
          },
        ])
      }
      setNewName('')
      setNewDesc('')
    } else {
      setError('Erreur lors de la création.')
    }
  }

  return (
    <section style={sectionStyle}>
      <p style={labelStyle}>Features</p>
      {error && <p style={errorStyle}>{error}</p>}
      {features.map(f => (
        <FeatureAccordion
          key={f.id}
          feature={f}
          apiUrl={apiUrl}
          onDelete={id => setFeatures(prev => prev.filter(f => f.id !== id))}
        />
      ))}
      <div style={addFeatureStyle}>
        <input
          placeholder="Feature name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={!canEdit}
          style={addInputStyle}
        />
        <input
          placeholder="Description (optional)"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          disabled={!canEdit}
          style={addInputStyle}
        />
        <Button variant="primary" onClick={handleAddFeature} disabled={!canEdit} style={{ gridColumn: 'span 2' }}>
          Add feature
        </Button>
      </div>
    </section>
  )
}

// Verrouillé : on montre que le contrôle existe, mais qu'il n'est pas actionnable ici.
const lockedSelectStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  cursor: 'not-allowed',
  opacity: 0.6,
}

const sectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }

const featureRefStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  marginRight: '0.5rem',
}
const accordionStyle: CSSProperties = { borderBottom: '1px solid var(--color-border)', marginBottom: '0.25rem' }
const accordionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.625rem 0',
  cursor: 'pointer',
  userSelect: 'none',
}
const chevronStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)', width: '12px' }
const featureNameStyle: CSSProperties = { flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }
const ticketCountStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
const accordionBodyStyle: CSSProperties = { padding: '0.5rem 0 0.75rem 1.25rem' }
const featureEditStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '1rem',
}
const featureActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const featureInputStyle: CSSProperties = {
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
const addTicketBtnStyle: CSSProperties = { marginTop: '0.75rem', alignSelf: 'flex-start', fontSize: '0.8125rem' }
const addFeatureStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto auto',
  gap: '0.5rem',
  alignItems: 'center',
  marginTop: '1rem',
}
const addInputStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}

const ticketStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  padding: '0.625rem 0.75rem',
  marginBottom: '0.5rem',
  cursor: 'pointer',
}
const ticketHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.25rem',
}
const ticketRefStyle: CSSProperties = { fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }
const ticketTitleStyle: CSSProperties = { flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }
const ticketDescStyle: CSSProperties = { fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem' }
const selectStyle: CSSProperties = {
  fontSize: '0.75rem',
  padding: '0.2rem 0.4rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  outline: 'none',
}
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
const docInlineLink: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }
const docAddStyle: CSSProperties = { display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.375rem' }
