import { useAsync } from '@atelier/shared-ui'
import { fetchPage } from '../api'
import type { PageType } from '../types'

export function usePage(pageType: PageType, pageRef: string | null) {
  const { data, status, retry } = useAsync(
    signal => (pageRef ? fetchPage(pageType, pageRef, signal) : Promise.resolve(null)),
    [pageType, pageRef],
  )

  return { page: data?.hasContent ? data : null, status, retry }
}
