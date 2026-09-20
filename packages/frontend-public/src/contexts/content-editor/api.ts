import { getJson } from '../../shared/api/http'
import type { PageLayout, PageType } from './types'

export function fetchPageLayout(pageType: PageType, pageRef: string, signal?: AbortSignal): Promise<PageLayout | null> {
  const params = new URLSearchParams({ pageType, pageRef })
  return getJson<PageLayout>(`/page-layouts/by-ref?${params}`, signal)
}
