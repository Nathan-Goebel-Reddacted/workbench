import { useEffect, useMemo, useState } from 'react'
import { isAbort } from '../../../shared/api/http'
import { getProject, projectDocuments, projectLinks } from '../api'
import type { Project } from '../types'

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    getProject(id, controller.signal)
      .then(data => {
        setProject(data)
        setLoading(false)
      })
      .catch(err => {
        if (!isAbort(err)) {
          setError('Could not load the project.')
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [id])

  const stores = useMemo(() => (id ? { documents: projectDocuments(id), links: projectLinks(id) } : null), [id])

  return { project, loading, error, stores }
}
