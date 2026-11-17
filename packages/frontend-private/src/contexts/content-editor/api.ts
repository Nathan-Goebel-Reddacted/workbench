import type { ComponentKind, ElementTransform, PageType } from '@content'
import { HttpError, getJson, send, sendJson } from '../../shared/api/http'
import type { MediaKind, Page, ProjectMedia, ReorderDirection } from './types'

const MEDIA_ENDPOINTS: Record<MediaKind, string> = {
  image: '/media/images',
  video: '/media/videos',
  mindmap: '/media/mindmaps',
  document: '/media/documents',
}

export function ensurePage(pageType: PageType, pageRef: string): Promise<Page> {
  return sendJson<Page>('/pages/by-ref', { method: 'PUT', body: { pageType, pageRef } })
}

export async function readPage(pageType: PageType, pageRef: string, signal?: AbortSignal): Promise<Page | null> {
  const params = new URLSearchParams({ pageType, pageRef })
  try {
    return await getJson<Page>(`/pages/private/by-ref?${params}`, signal)
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null
    throw error
  }
}

export function addElement(pageId: string, visibleTop: number): Promise<{ id: string }> {
  return sendJson<{ id: string }>(`/pages/${pageId}/elements`, { method: 'POST', body: { visibleTop } })
}

export function moveElement(pageId: string, elementId: string, transform: ElementTransform): Promise<void> {
  return send(`/pages/${pageId}/elements/${elementId}/transform`, { method: 'PATCH', body: transform })
}

export function reorderElement(pageId: string, elementId: string, direction: ReorderDirection): Promise<void> {
  return send(`/pages/${pageId}/elements/${elementId}/reorder`, { method: 'POST', body: { direction } })
}

export function duplicateElement(pageId: string, elementId: string): Promise<{ id: string }> {
  return sendJson<{ id: string }>(`/pages/${pageId}/elements/${elementId}/duplicate`, { method: 'POST' })
}

export function setComponent(pageId: string, elementId: string, kind: ComponentKind, value: object): Promise<void> {
  return send(`/pages/${pageId}/elements/${elementId}/components/${kind}`, { method: 'PUT', body: value })
}

export function removeComponent(pageId: string, elementId: string, kind: ComponentKind): Promise<void> {
  return send(`/pages/${pageId}/elements/${elementId}/components/${kind}`, { method: 'DELETE' })
}

export function deleteElement(pageId: string, elementId: string): Promise<void> {
  return send(`/pages/${pageId}/elements/${elementId}`, { method: 'DELETE' })
}

export function listMedia(kind: MediaKind, signal?: AbortSignal): Promise<ProjectMedia[]> {
  return getJson<ProjectMedia[]>(MEDIA_ENDPOINTS[kind], signal)
}
