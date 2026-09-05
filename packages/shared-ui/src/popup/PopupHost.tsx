import type { CSSProperties } from 'react'

type PopupHostProps = {
  messages: string[]
  onDismiss: () => void
}

export function PopupHost({ messages, onDismiss }: PopupHostProps) {
  if (messages.length === 0) return null

  return (
    <div role="alert" aria-live="assertive" style={hostStyle}>
      <div style={bodyStyle}>
        {messages.map(message => (
          <p key={message} style={messageStyle}>
            {message}
          </p>
        ))}
      </div>
      <button type="button" aria-label="Fermer" onClick={onDismiss} style={closeStyle}>
        ×
      </button>
    </div>
  )
}

const hostStyle: CSSProperties = {
  position: 'fixed',
  top: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  maxWidth: 'min(32rem, calc(100vw - 2rem))',
  padding: '0.75rem 0.75rem 0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--color-danger)',
  backgroundColor: 'var(--color-danger-soft)',
  boxShadow: '0 4px 16px rgb(0 0 0 / 0.15)',
}

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const messageStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.875rem',
  lineHeight: 1.4,
  color: 'var(--color-text)',
}

const closeStyle: CSSProperties = {
  flexShrink: 0,
  padding: 0,
  width: '1.5rem',
  height: '1.5rem',
  lineHeight: 1,
  fontSize: '1.125rem',
  cursor: 'pointer',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: 'transparent',
  color: 'var(--color-danger)',
}
