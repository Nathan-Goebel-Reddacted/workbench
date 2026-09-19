import { HttpError } from './http'

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function failureMessage(error: unknown, refused: string, unreachable: string): string {
  return error instanceof HttpError ? (error.detail ?? refused) : unreachable
}

export function errorDetailOr(error: unknown, fallback: string): string {
  return failureMessage(error, fallback, fallback)
}
