import type { ReactNode } from 'react'
import { LayoutPreview } from '@content'
import { PageShell } from '../../../shared/components/PageShell'
import { Async } from '../../../shared/components/PageStatus'
import { usePageLayout } from '../hooks/usePageLayout'
import type { PageType } from '../types'

type Props = { pageType: PageType; pageRef: string | null; blank: ReactNode }

export function PublishedPage({ pageType, pageRef, blank }: Props) {
  const { layout, isBlank, status, retry } = usePageLayout(pageType, pageRef)

  return (
    <Async status={status} onRetry={retry}>
      {() =>
        isBlank || !layout ? (
          blank
        ) : (
          <PageShell>
            <LayoutPreview sections={layout.sections} mode="public" />
          </PageShell>
        )
      }
    </Async>
  )
}
