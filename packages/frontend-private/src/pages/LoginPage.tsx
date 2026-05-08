import type { CSSProperties } from 'react'
import { useTheme } from '@atelier/shared-ui'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function LoginPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Atelier Portfolio</h1>
        <p style={subtitleStyle}>Connecte-toi pour accéder à l'espace privé.</p>
        <a href={`${API_URL}/auth/github`} style={oauthButtonStyle}>
          Continuer avec GitHub
        </a>
        <a href={`${API_URL}/auth/google`} style={oauthButtonStyle}>
          Continuer avec Google
        </a>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          style={themeSwitchStyle}
        >
          {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
        </button>
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
  color: '#ffffff',
  textDecoration: 'none',
  textAlign: 'center',
  fontWeight: 500,
}

const themeSwitchStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-text-muted)',
  fontSize: '0.75rem',
  padding: 0,
  alignSelf: 'center',
}
