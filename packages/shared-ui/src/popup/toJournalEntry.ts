import type { FetchErrorReport } from '@-reddacted-/react-ui'
import { ERROR_LOG_PATH, type ErrorReport } from '../errorLog/errorReporter'

/**
 * Traduit ce que la popup vient de signaler en entrée de journal. Le libellé affiché à l'écran est
 * écrit pour un visiteur ; celui du journal est écrit pour qui relira la table, donc il porte la
 * méthode, l'URL et le statut. Rend `null` pour ce qui ne doit pas être journalisé.
 */
export function toJournalEntry(report: FetchErrorReport): ErrorReport | null {
  // Le POST du journal ne se journalise pas lui-même : ce serait une boucle sans fin.
  if (report.url.includes(ERROR_LOG_PATH)) return null

  const request = `${report.method} ${report.url}`

  return {
    message: report.status ? `HTTP ${report.status} — ${request}` : `Requête échouée — ${request}`,
    stack: report.cause instanceof Error ? report.cause.stack : undefined,
    url: report.url,
    context: {
      kind: 'fetch',
      method: report.method,
      status: report.status,
      shownToUser: report.message,
    },
  }
}
