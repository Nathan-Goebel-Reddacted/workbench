import type { CSSProperties } from 'react'

export function HomePage() {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Atelier Portfolio</h1>
        <p style={subtitleStyle}>Espace public.</p>
      </div>
    </div>
  )
}

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--color-bg)',
}

const cardStyle: CSSProperties = {
  padding: '2rem',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.5rem',
  color: 'var(--color-text)',
}

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
}
