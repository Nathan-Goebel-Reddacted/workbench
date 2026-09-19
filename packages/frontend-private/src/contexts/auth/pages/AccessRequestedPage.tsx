import type { CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export function AccessRequestedPage() {
  const [params] = useSearchParams()
  const rejected = params.get('status') === 'rejected'

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>{rejected ? 'Access denied' : 'Request recorded'}</h1>
        <p style={textStyle}>
          {rejected
            ? 'This address has no access to the private area.'
            : 'Your address is not allowed yet. The request was sent to the administrator — you can log in once it is approved.'}
        </p>
        <Link to="/login" style={linkStyle}>
          Back to login
        </Link>
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
  padding: '1.5rem',
}

const cardStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '2rem',
  maxWidth: '420px',
  textAlign: 'center',
}

const titleStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: 'var(--color-text)',
  margin: '0 0 0.75rem',
}

const textStyle: CSSProperties = {
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-text-muted)',
  margin: '0 0 1.5rem',
}

const linkStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-primary)',
  textDecoration: 'none',
}
