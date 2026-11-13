import { getJson, send } from '../../shared/api/http'
import type { SiteAccess } from './types'

export function getSiteAccess(signal?: AbortSignal): Promise<SiteAccess> {
  return getJson<SiteAccess>('/site-access', signal)
}

export function setSiteAccess(open: boolean): Promise<void> {
  return send('/site-access', { method: 'PATCH', body: { open } })
}
