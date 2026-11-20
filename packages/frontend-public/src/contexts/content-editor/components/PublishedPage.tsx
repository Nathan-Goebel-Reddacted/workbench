import type { ReactNode } from 'react'
import { PageRenderer } from '@content'
import { PageShell } from '../../../shared/components/PageShell'
import { Async } from '../../../shared/components/PageStatus'
import { usePage } from '../hooks/usePage'
import type { PageType } from '../types'

type Props = { pageType: PageType; pageRef: string | null; blank: ReactNode }

export function PublishedPage({ pageType, pageRef, blank }: Props) {
  const { page, status, retry } = usePage(pageType, pageRef)

  return (
    <Async status={status} onRetry={retry}>
      {() =>
        page ? (
          <PageShell canvas>
            <PageRenderer page={page} />
          </PageShell>
        ) : (
          blank
        )
      }
    </Async>
  )
}
