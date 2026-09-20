import type { PageLayoutDto, PageType, SectionContent, SectionPosition } from '@content'
import { getJson, send, sendJson } from '../../shared/api/http'
import type { MediaKind, NewSection, ProjectMedia } from './types'

const MEDIA_ENDPOINTS: Record<MediaKind, string> = {
  image: '/media/images',
  video: '/media/videos',
  mindmap: '/media/mindmaps',
  document: '/media/documents',
}

function layoutPath(layoutId: string): string {
  return `/page-layouts/${layoutId}`
}

export function ensurePageLayout(pageType: PageType, pageRef: string): Promise<PageLayoutDto> {
  return sendJson<PageLayoutDto>('/page-layouts/by-ref', { method: 'PUT', body: { pageType, pageRef } })
}

export function addSection(layoutId: string, section: NewSection): Promise<void> {
  return send(`${layoutPath(layoutId)}/sections`, { method: 'POST', body: section })
}

export function updateSectionContent(layoutId: string, sectionId: string, content: SectionContent): Promise<void> {
  return send(`${layoutPath(layoutId)}/sections/${sectionId}/content`, { method: 'PATCH', body: { content } })
}

export function moveSection(layoutId: string, sectionId: string, position: SectionPosition): Promise<void> {
  return send(`${layoutPath(layoutId)}/sections/${sectionId}/move`, { method: 'PATCH', body: position })
}

export function removeSection(layoutId: string, sectionId: string): Promise<void> {
  return send(`${layoutPath(layoutId)}/sections/${sectionId}`, { method: 'DELETE' })
}

export function listMedia(kind: MediaKind, signal?: AbortSignal): Promise<ProjectMedia[]> {
  return getJson<ProjectMedia[]>(MEDIA_ENDPOINTS[kind], signal)
}
