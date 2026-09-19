import type { CSSProperties } from 'react'

export const sectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}

export const sectionLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}

export const errorStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-primary)',
  marginBottom: '0.75rem',
}

export const emptyStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  margin: 0,
}

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

export const thStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid var(--color-border)',
}

export const trStyle: CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
}

export const tdStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  padding: '0.625rem 0.75rem',
  verticalAlign: 'middle',
}

export const mutedTdStyle: CSSProperties = { ...tdStyle, color: 'var(--color-text-muted)' }

export const codeStyle: CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  padding: '0.125rem 0.375rem',
}
