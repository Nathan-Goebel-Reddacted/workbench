import { useEffect, useState } from 'react'
import { isAbort } from '../../../shared/api/http'
import { listMedia } from '../api'
import type { MediaKind, ProjectMedia } from '../types'

export function useMedia(kind: MediaKind) {
  const [projects, setProjects] = useState<ProjectMedia[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    listMedia(kind, controller.signal)
      .then(setProjects)
      .catch(err => {
        if (!isAbort(err)) setProjects([])
      })
    return () => controller.abort()
  }, [kind])

  return projects
}
