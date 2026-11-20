import type { CSSProperties, ReactNode } from 'react'
import { Button, PageStatus, type AsyncStatus } from '@atelier/shared-ui'

export function LoadingMessage() {
  return <PageStatus role="status" description={<span style={descriptionStyle}>Chargement…</span>} />
}

export function ErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <PageStatus
      role="alert"
      description={
        <span style={descriptionStyle}>
          Le contenu n’a pas pu être chargé. Vérifiez votre connexion, puis réessayez.
        </span>
      }
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Réessayer
          </Button>
        )
      }
    />
  )
}

type AsyncProps = {
  status: AsyncStatus
  onRetry?: () => void
  children: () => ReactNode
}

// Les children sont une fonction, pas un nœud : une page les construit à partir de données
// qui n'existent pas encore pendant le chargement, et un nœud construit d'avance s'évaluerait
// quand même.
export function Async({ status, onRetry, children }: AsyncProps) {
  if (status === 'loading') return <LoadingMessage />
  if (status === 'error') return <ErrorMessage onRetry={onRetry} />
  return <>{children()}</>
}

const descriptionStyle: CSSProperties = {
  fontSize: '0.9375rem',
}
