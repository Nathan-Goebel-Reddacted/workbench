import { getJson, send } from '../../shared/api/http'
import type { ContactMessage } from './types'

export function listContactMessages(): Promise<ContactMessage[]> {
  return getJson<ContactMessage[]>('/contact')
}

export function deleteAllContactMessages(): Promise<void> {
  return send('/contact', { method: 'DELETE' })
}

export function deleteContactMessage(id: string): Promise<void> {
  return send(`/contact/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
