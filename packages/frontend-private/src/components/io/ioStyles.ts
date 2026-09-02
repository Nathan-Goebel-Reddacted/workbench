import type { CSSProperties } from 'react'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const choiceStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'flex-start',
  padding: '0.75rem',
  marginBottom: '0.625rem',
  cursor: 'pointer',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
}
export const selectedChoiceStyle: CSSProperties = {
  ...choiceStyle,
  borderColor: 'var(--color-primary)',
}
export const choiceLabelStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text)',
}
export const hintStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  marginTop: '0.25rem',
}
export const errorStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-primary)',
  marginTop: '0.75rem',
}
export const mutedStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-muted)',
}
export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}
export const reportRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  padding: '0.375rem 0',
  borderBottom: '1px solid var(--color-border)',
}
