import { getJson, send } from '../../shared/api/http'
import type { ErrorLogSlice } from './types'

export function listErrorLog(query: string): Promise<ErrorLogSlice> {
  return getJson<ErrorLogSlice>(`/error-log?${query}`)
}

export function purgeErrorLog(before: string | null): Promise<void> {
  return send(`/error-log${before ? `?before=${encodeURIComponent(before)}` : ''}`, { method: 'DELETE' })
}
