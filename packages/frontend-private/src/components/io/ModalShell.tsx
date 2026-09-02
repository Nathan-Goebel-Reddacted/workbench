import type { CSSProperties, ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function ModalShell({ title, onClose, children, footer }: Props) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>{title}</span>
          <button style={closeStyle} onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>

        <div style={bodyStyle}>{children}</div>

        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  backdropFilter: 'brightness(0.45) blur(2px)',
  WebkitBackdropFilter: 'brightness(0.45) blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}
const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: '540px',
  maxHeight: '85vh',
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
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--color-text-muted)',
  fontSize: '0.95rem',
  lineHeight: 1,
}
const bodyStyle: CSSProperties = { padding: '1.25rem', overflowY: 'auto', flex: 1 }
const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  padding: '1rem 1.25rem',
  borderTop: '1px solid var(--color-border)',
}
