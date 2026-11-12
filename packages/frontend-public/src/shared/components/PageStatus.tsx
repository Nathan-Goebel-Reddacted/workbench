import type { ReactNode } from 'react'
import {
  ErrorMessage as BaseErrorMessage,
  LoadingMessage as BaseLoadingMessage,
  type AsyncStatus,
} from '@atelier/shared-ui'

export function LoadingMessage() {
  return <BaseLoadingMessage label="Chargement…" />
}

export function ErrorMessage({ onRetry }: { onRetry?: () => void }) {
  return (
    <BaseErrorMessage
      onRetry={onRetry}
      label="Le contenu n’a pas pu être chargé. Vérifiez votre connexion, puis réessayez."
      retryLabel="Réessayer"
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
