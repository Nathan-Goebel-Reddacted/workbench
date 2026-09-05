import type { PopupMessages } from '@-reddacted-/react-ui'

// Le package parle anglais par défaut : Workbench pose ses propres libellés une seule
// fois, ici, pour les deux frontends et pour le test.
export const popupMessages: PopupMessages = {
  networkFailure: 'Le serveur est injoignable.',
  forbidden: "Vous n'avez pas les droits pour cette action.",
  notFound: 'La ressource demandée est introuvable.',
  serverError: 'Le serveur a rencontré une erreur.',
  requestFailed: status => `La requête a échoué (${status}).`,
}
