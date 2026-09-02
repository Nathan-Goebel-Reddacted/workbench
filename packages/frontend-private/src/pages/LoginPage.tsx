import { useEffect, useState, type CSSProperties } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type Provider = 'github' | 'google'

const PROVIDER_LABELS: Record<Provider, string> = {
  github: 'Continuer avec GitHub',
  google: 'Continuer avec Google',
}

export function LoginPage() {
  // Un fournisseur dont les identifiants ne sont pas configurés n'a pas de route côté backend :
  // afficher son bouton mènerait à un 404. C'est le serveur qui dit ce qui est branché.
  const [providers, setProviders] = useState<Provider[] | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/auth/providers`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { providers: Provider[] }) => setProviders(data.providers))
      .catch(() => setProviders([]))
  }, [])

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Atelier Portfolio</h1>
        <p style={subtitleStyle}>Connecte-toi pour accéder à l'espace privé.</p>

        {providers === null && <p style={subtitleStyle}>Chargement…</p>}

        {providers?.length === 0 && (
          <p style={subtitleStyle}>
            Aucun fournisseur de connexion n'est disponible. Le serveur est peut-être injoignable.
          </p>
        )}

        {providers?.map(provider => (
          <a key={provider} href={`${API_URL}/auth/${provider}`} style={oauthButtonStyle}>
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
