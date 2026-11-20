import { resolveUploadUrl } from '../media/documentKind'
import type { LinkComponent } from './pageTypes'

export function projectPagePath(projectId: string): string {
  return `/projects/${projectId}`
}

export function linkHref(link: LinkComponent, apiUrl: string): string | null {
  if (link.projectId) {
    const destination = link.destination ?? { kind: 'none' }
    if (destination.kind === 'page') return projectPagePath(destination.projectId)
    if (destination.kind === 'external') return destination.url
    return null
  }
  if (!link.url) return null
  return link.url.startsWith('/uploads/') ? resolveUploadUrl(link.url, apiUrl) : link.url
}
