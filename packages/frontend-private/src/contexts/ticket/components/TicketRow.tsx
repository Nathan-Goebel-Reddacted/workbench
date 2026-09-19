import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { TICKET_STATUSES, type TicketStatus } from '../status'
import { TICKET_STATUS_LABELS } from './statusLabels'
import { useTicket } from '../hooks/useTicket'
import type { Ticket } from '../types'
import { TicketModal } from './TicketModal'
import { uploadUrl } from '../../../shared/config'

const LOCKED_STATUS_HINT = 'Status locked.'

export function TicketRow({
  ticket,
  onUpdate,
  onDelete,
}: {
  ticket: Ticket
  onUpdate: (id: string, updated: Partial<Ticket>) => void
  onDelete: (id: string) => void
}) {
  const canEdit = useCanEdit()
  const [modalOpen, setModalOpen] = useState(false)
  const { error, changeStatus } = useTicket(ticket, updated => onUpdate(ticket.id, updated))

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
            onChange={e => changeStatus(e.target.value as TicketStatus)}
            disabled={!canEdit || ticket.statusLocked}
            title={ticket.statusLocked ? LOCKED_STATUS_HINT : undefined}
            style={ticket.statusLocked ? lockedSelectStyle : selectStyle}
          >
            {TICKET_STATUSES.map(s => (
              <option key={s} value={s}>
                {TICKET_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        {error && <p style={errorStyle}>{error}</p>}
        {ticket.description && <p style={ticketDescStyle}>{ticket.description}</p>}
        {ticket.notes.length > 0 && (
          <ul style={notesListStyle}>
            {ticket.notes.map(n => (
              <li key={n.id} style={noteStyle}>
                {n.text}
              </li>
            ))}
          </ul>
        )}
        {ticket.documents.length > 0 && (
          <ul style={notesListStyle}>
            {ticket.documents.map(d => (
              <li key={d.id} style={noteStyle}>
                <a
                  href={uploadUrl(d.url)}
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
          onClose={() => setModalOpen(false)}
          onUpdate={updated => onUpdate(ticket.id, updated)}
          onDelete={() => onDelete(ticket.id)}
        />
      )}
    </>
  )
}

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
const errorStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-primary)', margin: '0 0 0.25rem' }
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
const docInlineLink: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }
