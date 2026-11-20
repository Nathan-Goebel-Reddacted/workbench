import type { CSSProperties } from 'react'

export const panelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }
export const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
export const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
export const inputStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
}
export const fileStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.8125rem',
  color: 'var(--color-text-muted)',
}
export const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' }
