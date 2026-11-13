import { getJson } from '../../shared/api/http'
import type { SiteAccess } from './types'

const CLOSED: SiteAccess = { open: false, served: false }

export async function getSiteAccess(signal?: AbortSignal): Promise<SiteAccess> {
  return (await getJson<SiteAccess>('/site-access', signal)) ?? CLOSED
}
