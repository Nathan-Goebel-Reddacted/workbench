import { getJson, send, sendJson } from '../../shared/api/http'
import { documentStore } from '../../shared/api/documents'
import { linkStore } from '../../shared/api/links'
import type { Category } from '../../shared/domain/category'
import type { DocumentStore } from '../../shared/domain/document'
import type { LinkStore } from '../../shared/domain/link'
import type { Project, ProjectInfo, ProjectSummary } from './types'

function projectPath(id: string): string {
  return `/projects/${id}`
}

export function projectDocuments(id: string): DocumentStore {
  return documentStore(projectPath(id))
}

export function projectLinks(id: string): LinkStore {
  return linkStore(projectPath(id))
}

export function listProjects(signal?: AbortSignal): Promise<ProjectSummary[]> {
  return getJson<ProjectSummary[]>('/projects', signal)
}

export function getProject(id: string, signal?: AbortSignal): Promise<Project> {
  return getJson<Project>(projectPath(id), signal)
}

export async function createProject(name: string, category?: Category): Promise<string> {
  const { id } = await sendJson<{ id: string }>('/projects', { method: 'POST', body: { name, category } })
  return id
}

export function updateProjectInfo(id: string, info: ProjectInfo): Promise<void> {
  return send(projectPath(id), { method: 'PATCH', body: info })
}

export function setProjectVisibility(id: string, visible: boolean): Promise<void> {
  return send(`${projectPath(id)}/visibility`, { method: 'PATCH', body: { visible } })
}
