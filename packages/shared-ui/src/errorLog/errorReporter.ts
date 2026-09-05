export type ErrorReport = {
  message: string
  stack?: string | null
  url?: string | null
  context?: Record<string, unknown>
}

export const ERROR_LOG_PATH = '/error-log'

/** A broken page can fire the same failure on every render: past this, the journal learns nothing. */
const MAX_REPORTS_PER_SESSION = 20

let nativeFetch: typeof fetch | null = null

/**
 * The reporter must never travel through an intercepted fetch, or a failing POST would report
 * itself in a loop. Captured on the first call — which happens while ErrorReporterProvider
 * renders, and React runs a parent's render before any child effect installs an interception.
 * Lazy rather than at import time: this module also loads outside a browser.
 */
function captureNativeFetch(): typeof fetch {
  nativeFetch ??= window.fetch.bind(window)
  return nativeFetch
}

export function createErrorReporter(apiUrl: string) {
  const send = captureNativeFetch()
  const seen = new Set<string>()
  let sent = 0

  return function report(entry: ErrorReport): void {
    const message = entry.message?.trim()
    if (!message) return

    const signature = `${message}|${entry.url ?? ''}`
    if (seen.has(signature) || sent >= MAX_REPORTS_PER_SESSION) return
    seen.add(signature)
    sent += 1

    void send(`${apiUrl}${ERROR_LOG_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        message,
        stack: entry.stack ?? undefined,
        url: entry.url ?? window.location.href,
        context: entry.context,
        occurredAt: new Date().toISOString(),
      }),
    }).catch(() => {
      // A journal that cannot be reached is not the visitor's problem.
    })
  }
}
