import { useCallback, useEffect, useState } from 'react'
import { errorDetailOr, isAbort } from '../../../shared/api/errors'
import { createIdea, listIdeas } from '../api'
import type { IdeaSummary } from '../types'

export function useIdeas() {
  const [ideas, setIdeas] = useState<IdeaSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      setIdeas(await listIdeas(signal))
    } catch (err: unknown) {
      if (!isAbort(err)) setError('Could not load the ideas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    reload(controller.signal)
    return () => controller.abort()
  }, [reload])

  const create = async (name: string): Promise<boolean> => {
    setCreating(true)
    setCreateError(null)
    try {
      await createIdea(name)
      setIdeas(await listIdeas())
      return true
    } catch (err) {
      setCreateError(errorDetailOr(err, 'Could not create.'))
      return false
    } finally {
      setCreating(false)
    }
  }

  return { ideas, loading, error, createError, creating, create }
}
