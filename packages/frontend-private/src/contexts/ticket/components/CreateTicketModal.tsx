import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'

export function CreateTicketModal({
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
    try {
      await onCreate(title, description)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <span style={modalTitleStyle}>New ticket</span>
          <button style={closeButtonStyle} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={modalFieldStyle}>
          <label style={modalLabelStyle}>Title</label>
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
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canEdit || submitting || !title.trim()}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
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
