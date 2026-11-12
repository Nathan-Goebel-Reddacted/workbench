import { useEffect, useState } from 'react'
import { setProjectPageReplacement } from '../api'
import type { Link } from '../../../shared/domain/link'

export function useProjectPageReplacement(projectId: string, links: Link[]) {
  const [replacingUrl, setReplacingUrl] = useState<string | null>(null)

  useEffect(() => {
    setReplacingUrl(links.find(l => l.replacesPage)?.url ?? null)
  }, [links])

  const change = (url: string | null) => {
    const previous = replacingUrl
    setReplacingUrl(url)
    setProjectPageReplacement(projectId, url).catch(() => setReplacingUrl(previous))
  }

  return { replacingUrl, change }
}
