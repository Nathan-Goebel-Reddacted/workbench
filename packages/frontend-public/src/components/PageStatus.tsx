import type { CSSProperties, ReactNode } from 'react'
import { Button } from '@atelier/shared-ui'

// Trois états distincts pour toutes les pages publiques. Avant, une panne réseau
// retombait dans le chemin « pas de contenu » : le visiteur voyait un site vide
// sans savoir que la requête avait échoué.
export type LoadStatus = 'loading' | 'ready' | 'error'

export function PageMessage({ children }: { children: ReactNode }) {
  return <div style={containerStyle}>{children}</div>
}

export function LoadingMessage() {
  return (
    <PageMessage>
      <p style={mutedStyle} role="status">
        Chargement…
      </p>
    </PageMessage>
  )
}

export function ErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <PageMessage>
      <div style={stackStyle}>
        <p style={mutedStyle} role="alert">
          Le contenu n’a pas pu être chargé. Vérifiez votre connexion, puis réessayez.
        </p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </div>
    </PageMessage>
  )
}

const containerStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  backgroundColor: 'var(--color-bg)',
}

const stackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  textAlign: 'center',
}

const mutedStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.9375rem',
  color: 'var(--color-text-muted)',
}
