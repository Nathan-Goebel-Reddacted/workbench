import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@atelier/shared-ui'
import {
  BINDING_ENTITY_LABELS,
  BINDING_FIELDS,
  type BindingEntity,
  type BindingField,
  type DataBindingAttrs,
} from '@atelier/content-renderer'

type ProjectSummary = { id: string; name: string }
type FeatureSummary = { id: string; name: string }
type TicketSummary = { id: string; reference: string; title: string }

type Props = {
  apiUrl: string
  onInsert: (attrs: DataBindingAttrs) => void
  onClose: () => void
}

// Petit hook de fetch de liste avec abort. url null => liste vide, pas de requête.
function useFetchList<T>(url: string | null): T[] {
  const [items, setItems] = useState<T[]>([])
  useEffect(() => {
    if (!url) {
      setItems([])
      return
    }
    const controller = new AbortController()
    fetch(url, { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? (res.json() as Promise<T[]>) : []))
      .then(setItems)
      .catch(err => {
        if (err.name !== 'AbortError') setItems([])
      })
    return () => controller.abort()
  }, [url])
  return items
}

export function DataBindingPicker({ apiUrl, onInsert, onClose }: Props) {
  const [projectId, setProjectId] = useState('')
  const [entity, setEntity] = useState<BindingEntity>('project')
  const [featureId, setFeatureId] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [field, setField] = useState<BindingField>('name')

  const projects = useFetchList<ProjectSummary>(`${apiUrl}/projects`)
  const features = useFetchList<FeatureSummary>(
    // Une page publique se compose pour un projet : les features d'une idée n'ont rien à y faire.
    projectId && entity !== 'project' ? `${apiUrl}/features/by-owner/project/${projectId}` : null,
  )
  const tickets = useFetchList<TicketSummary>(
    entity === 'ticket' && featureId ? `${apiUrl}/tickets/by-feature/${featureId}` : null,
  )

  // Le champ doit rester valide quand on change d'entité.
  const fields = BINDING_FIELDS[entity]
  useEffect(() => {
    if (!fields.some(f => f.value === field)) setField(fields[0].value)
  }, [entity, fields, field])

  const targetId = entity === 'project' ? projectId : entity === 'feature' ? featureId : ticketId
  const canInsert = !!projectId && !!targetId

  const handleInsert = () => {
    if (!canInsert) return
    onInsert({ entity, id: targetId, field })
    onClose()
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose} onPointerDown={e => e.stopPropagation()}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>Insérer une donnée</span>
          <button style={closeStyle} onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>

        <div style={bodyStyle}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Projet</span>
            <select
              style={inputStyle}
              value={projectId}
              onChange={e => {
                setProjectId(e.target.value)
                setFeatureId('')
                setTicketId('')
              }}
            >
              <option value="">— Choisir un projet —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Cible</span>
            <select
              style={inputStyle}
              value={entity}
              onChange={e => {
                setEntity(e.target.value as BindingEntity)
                setFeatureId('')
                setTicketId('')
              }}
            >
              {(Object.keys(BINDING_ENTITY_LABELS) as BindingEntity[]).map(e => (
                <option key={e} value={e}>
                  {BINDING_ENTITY_LABELS[e]}
                </option>
              ))}
            </select>
          </label>

          {entity !== 'project' && projectId && (
            <label style={fieldStyle}>
              <span style={labelStyle}>Feature</span>
              <select
                style={inputStyle}
                value={featureId}
                onChange={e => {
                  setFeatureId(e.target.value)
                  setTicketId('')
                }}
              >
                <option value="">— Choisir une feature —</option>
                {features.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {entity === 'ticket' && featureId && (
            <label style={fieldStyle}>
              <span style={labelStyle}>Ticket</span>
              <select style={inputStyle} value={ticketId} onChange={e => setTicketId(e.target.value)}>
                <option value="">— Choisir un ticket —</option>
                {tickets.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.reference} — {t.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label style={fieldStyle}>
            <span style={labelStyle}>Champ</span>
            <select style={inputStyle} value={field} onChange={e => setField(e.target.value as BindingField)}>
              {fields.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={footerStyle}>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleInsert} disabled={!canInsert}>
            Insérer
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1100,
  backdropFilter: 'brightness(0.45) blur(2px)',
  WebkitBackdropFilter: 'brightness(0.45) blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}
const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  overflow: 'hidden',
}
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.25rem',
  borderBottom: '1px solid var(--color-border)',
}
const titleStyle: CSSProperties = { fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }
const closeStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  color: 'var(--color-text-muted)',
}
const bodyStyle: CSSProperties = { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }
const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
  padding: '1rem 1.25rem',
  borderTop: '1px solid var(--color-border)',
}
const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
const inputStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}
