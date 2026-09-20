import { getJson } from '../../shared/api/http'
import { isCategory } from './types'
import type { ProjectSummary, PublishedProject } from './types'

type ProjectSummaryDto = { id: string; name: string; description: string; category: string }
type ProjectDto = { id: string; name: string }

export async function listPublishedProjects(signal?: AbortSignal): Promise<ProjectSummary[]> {
  const dtos = await getJson<ProjectSummaryDto[]>('/projects', signal)
  return (dtos ?? []).map(dto => ({
    id: dto.id,
    name: dto.name,
    description: dto.description,
    category: isCategory(dto.category) ? dto.category : null,
  }))
}

export async function fetchPublishedProject(id: string, signal?: AbortSignal): Promise<PublishedProject | null> {
  // Un projet masqué est indiscernable d'un projet inexistant : le serveur rend 200 sans
  // corps dans les deux cas.
  const dto = await getJson<ProjectDto>(`/projects/${id}`, signal)
  return dto ? { id: dto.id, name: dto.name } : null
}
