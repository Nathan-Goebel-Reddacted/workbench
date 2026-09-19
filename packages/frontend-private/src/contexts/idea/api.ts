import { getJson, send, sendJson } from '../../shared/api/http'
import { documentStore } from '../../shared/api/documents'
import { linkStore } from '../../shared/api/links'
import type { DocumentStore } from '../../shared/domain/document'
import type { LinkStore } from '../../shared/domain/link'
import type { Idea, IdeaDeletionImpact, IdeaInfo, IdeaSummary } from './types'

function ideaPath(id: string): string {
  return `/ideas/${id}`
}

export function ideaDocuments(id: string): DocumentStore {
  return documentStore(ideaPath(id))
}

export function ideaLinks(id: string): LinkStore {
  return linkStore(ideaPath(id))
}

export function listIdeas(signal?: AbortSignal): Promise<IdeaSummary[]> {
  return getJson<IdeaSummary[]>('/ideas', signal)
}

export function getIdea(id: string, signal?: AbortSignal): Promise<Idea | null> {
  return getJson<Idea | null>(ideaPath(id), signal)
}

export async function createIdea(name: string): Promise<string> {
  const { id } = await sendJson<{ id: string }>('/ideas', { method: 'POST', body: { name } })
  return id
}

export function updateIdeaInfo(id: string, info: IdeaInfo): Promise<void> {
  return send(ideaPath(id), { method: 'PUT', body: info })
}

export function getIdeaDeletionImpact(id: string): Promise<IdeaDeletionImpact> {
  return getJson<IdeaDeletionImpact>(`${ideaPath(id)}/deletion-impact`)
}

export function deleteIdea(id: string): Promise<void> {
  return send(ideaPath(id), { method: 'DELETE' })
}

export async function convertIdeaToProject(id: string): Promise<string> {
  const { projectId } = await sendJson<{ projectId: string }>(`${ideaPath(id)}/convert-to-project`, { method: 'POST' })
  return projectId
}
