import { useEffect, useMemo, useState } from 'react'
import { errorDetailOr, failureMessage, isAbort } from '../../../shared/api/errors'
import { convertIdeaToProject, deleteIdea, getIdea, getIdeaDeletionImpact, ideaDocuments, ideaLinks } from '../api'
import type { Idea, IdeaDeletionImpact } from '../types'

export function useIdea(id: string | undefined) {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    getIdea(id, controller.signal)
      .then(data => {
        if (!data) setError('Idea not found.')
        else setIdea(data)
        setLoading(false)
      })
      .catch(err => {
        if (!isAbort(err)) {
          setError('Could not load the idea.')
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [id])

  const stores = useMemo(() => (id ? { documents: ideaDocuments(id), links: ideaLinks(id) } : null), [id])

  const deletionImpact = async (): Promise<IdeaDeletionImpact | null> => {
    if (!idea) return null
    try {
      return await getIdeaDeletionImpact(idea.id)
    } catch (err) {
      setError(errorDetailOr(err, 'Could not check what the deletion removes.'))
      return null
    }
  }

  const remove = async (): Promise<boolean> => {
    if (!idea) return false
    try {
      await deleteIdea(idea.id)
      return true
    } catch (err) {
      setError(failureMessage(err, 'Could not delete.', 'Network error.'))
      return false
    }
  }

  const convertToProject = async (): Promise<string | null> => {
    if (!idea) return null
    try {
      return await convertIdeaToProject(idea.id)
    } catch (err) {
      setError(failureMessage(err, 'Could not convert.', 'Network error.'))
      return null
    }
  }

  return { idea, loading, error, stores, deletionImpact, remove, convertToProject }
}
