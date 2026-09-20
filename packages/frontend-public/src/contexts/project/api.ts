import { getJson } from '../../shared/api/http'
import { isCategory, isDestination } from './types'
import type { ProjectDestination, ProjectSummary, PublishedProject } from './types'

type ProjectSummaryDto = { id: string; name: string; description: string; category: string; destination: unknown }
type ProjectDto = { id: string; name: string; destination: unknown }

function destinationOf(value: unknown): ProjectDestination {
  return isDestination(value) ? value : { kind: 'page' }
}

export async function listPublishedProjects(signal?: AbortSignal): Promise<ProjectSummary[]> {
  const dtos = await getJson<ProjectSummaryDto[]>('/projects', signal)
  return (dtos ?? []).map(dto => ({
    id: dto.id,
    name: dto.name,
    description: dto.description,
    category: isCategory(dto.category) ? dto.category : null,
    destination: destinationOf(dto.destination),
  }))
}

export async function fetchPublishedProject(id: string, signal?: AbortSignal): Promise<PublishedProject | null> {
  // Un projet masqué est indiscernable d'un projet inexistant : le serveur rend 200 sans
  // corps dans les deux cas.
  const dto = await getJson<ProjectDto>(`/projects/${id}`, signal)
  return dto ? { id: dto.id, name: dto.name, destination: destinationOf(dto.destination) } : null
}
