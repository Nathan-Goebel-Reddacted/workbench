import { ErrorMessage as BaseErrorMessage, LoadingMessage as BaseLoadingMessage } from '@atelier/shared-ui'

export { PageMessage, type LoadStatus } from '@atelier/shared-ui'

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
