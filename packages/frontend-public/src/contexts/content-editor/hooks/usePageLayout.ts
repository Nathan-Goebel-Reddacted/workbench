import { useAsync } from '@atelier/shared-ui'
import { fetchPageLayout } from '../api'
import { isBlankLayout } from '../types'
import type { PageType } from '../types'

export function usePageLayout(pageType: PageType, pageRef: string | null) {
  const { data, status, retry } = useAsync(
    signal => (pageRef ? fetchPageLayout(pageType, pageRef, signal) : Promise.resolve(null)),
    [pageType, pageRef],
  )

  return { layout: data, isBlank: isBlankLayout(data), status, retry }
}
