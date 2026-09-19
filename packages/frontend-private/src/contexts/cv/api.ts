import { getJson, send, sendJson } from '../../shared/api/http'
import type { Cv } from './types'

export function listCvs(signal?: AbortSignal): Promise<Cv[]> {
  return getJson<Cv[]>('/cvs', signal)
}

export async function createCv(name: string, fileUrl: string): Promise<string> {
  const { id } = await sendJson<{ id: string }>('/cvs', { method: 'POST', body: { name, fileUrl } })
  return id
}

export function reorderCvs(ids: string[]): Promise<void> {
  return send('/cvs/order', { method: 'PUT', body: { ids } })
}

export function setCvVisibility(id: string, visible: boolean): Promise<void> {
  return send(`/cvs/${id}`, { method: 'PATCH', body: { visible } })
}

export function deleteCv(id: string): Promise<void> {
  return send(`/cvs/${id}`, { method: 'DELETE' })
}
