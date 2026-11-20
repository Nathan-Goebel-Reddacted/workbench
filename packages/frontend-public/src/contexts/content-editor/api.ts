import { getJson } from '../../shared/api/http'
import type { Page, PageType } from './types'

export function fetchPage(pageType: PageType, pageRef: string, signal?: AbortSignal): Promise<Page | null> {
  const params = new URLSearchParams({ pageType, pageRef })
  return getJson<Page>(`/pages/by-ref?${params}`, signal)
}
