import { getJson, send, sendJson } from '../../shared/api/http'
import type { Feature, FeatureInfo, OwnerType } from './types'

export function listFeaturesByOwner(ownerType: OwnerType, ownerId: string, signal?: AbortSignal): Promise<Feature[]> {
  return getJson<Feature[]>(`/features/by-owner/${ownerType}/${ownerId}`, signal)
}

export async function createFeature(ownerType: OwnerType, ownerId: string, info: FeatureInfo): Promise<string> {
  const { id } = await sendJson<{ id: string }>('/features', { method: 'POST', body: { ownerType, ownerId, ...info } })
  return id
}

export function updateFeature(id: string, info: FeatureInfo): Promise<void> {
  return send(`/features/${id}`, { method: 'PATCH', body: info })
}

export function deleteFeature(id: string): Promise<void> {
  return send(`/features/${id}`, { method: 'DELETE' })
}
