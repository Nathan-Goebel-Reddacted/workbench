const AUTH_PROBE_PATH = '/auth/me'

export const NETWORK_FAILURE_MESSAGE = 'Le serveur est injoignable.'

export function shouldReportResponse(res: Response): boolean {
  if (res.ok) return false
  if (res.status === 400 || res.status === 422) return false
  if (res.status === 401 && isAuthProbe(res.url)) return false
  return true
}

export function shouldReportFailure(cause: unknown): boolean {
  return !(cause instanceof Error && cause.name === 'AbortError')
}

export async function describeResponse(res: Response): Promise<string> {
  return (await readBodyMessage(res)) ?? genericMessage(res.status)
}

function isAuthProbe(url: string): boolean {
  try {
    return new URL(url).pathname.endsWith(AUTH_PROBE_PATH)
  } catch {
    return url.includes(AUTH_PROBE_PATH)
  }
}

async function readBodyMessage(res: Response): Promise<string | null> {
  try {
    const body = (await res.clone().json()) as { message?: unknown }
    return typeof body.message === 'string' && body.message.trim() !== '' ? body.message.trim() : null
  } catch {
    return null
  }
}

function genericMessage(status: number): string {
  if (status === 401 || status === 403) return "Vous n'avez pas les droits pour cette action."
  if (status === 404) return 'La ressource demandée est introuvable.'
  if (status >= 500) return 'Le serveur a rencontré une erreur.'
  return `La requête a échoué (${status}).`
}
