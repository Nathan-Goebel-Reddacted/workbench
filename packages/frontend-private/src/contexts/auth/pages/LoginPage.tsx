import type { CSSProperties } from 'react'
import { useLoginProviders } from '../hooks/useLoginProviders'
import type { Provider } from '../types'

const PROVIDER_LABELS: Record<Provider, string> = {
  github: 'Continue with GitHub',
  google: 'Continue with Google',
}

export function LoginPage() {
  const { providers, loginUrl } = useLoginProviders()

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Atelier Portfolio</h1>
        <p style={subtitleStyle}>Log in to reach the private area.</p>

        {providers === null && <p style={subtitleStyle}>Loading…</p>}

        {providers?.length === 0 && (
          <p style={subtitleStyle}>No login provider is available. The server may be unreachable.</p>
        )}

        {providers?.map(provider => (
          <a key={provider} href={loginUrl(provider)} style={oauthButtonStyle}>
            {PROVIDER_LABELS[provider]}
          </a>
        ))}
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
  gap: '1rem',
  width: '100%',
  maxWidth: '360px',
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

const oauthButtonStyle: CSSProperties = {
  display: 'block',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-on-primary)',
  textDecoration: 'none',
  textAlign: 'center',
  fontWeight: 500,
}
