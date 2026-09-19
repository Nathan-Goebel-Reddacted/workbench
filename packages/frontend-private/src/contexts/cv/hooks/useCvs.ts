import { useCallback, useEffect, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { errorDetailOr } from '../../../shared/api/http'
import { createCv, deleteCv, listCvs, reorderCvs, setCvVisibility } from '../api'
import type { Cv } from '../types'

export function useCvs() {
  const [cvs, setCvs] = useState<Cv[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      setCvs(await listCvs(signal))
    } catch {
      if (signal?.aborted) return
      setError('Could not load the CVs.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    reload(controller.signal)
    return () => controller.abort()
  }, [reload])

  const move = async (fromId: string, toId: string): Promise<void> => {
    const from = cvs.findIndex(cv => cv.id === fromId)
    const to = cvs.findIndex(cv => cv.id === toId)
    if (from === -1 || to === -1) return

    const previous = cvs
    const reordered = arrayMove(cvs, from, to)
    setCvs(reordered)

    try {
      await reorderCvs(reordered.map(cv => cv.id))
    } catch {
      setCvs(previous)
      setError('Could not save the new order.')
    }
  }

  const toggleVisibility = async (cv: Cv): Promise<void> => {
    const visible = !cv.visible
    setCvs(prev => prev.map(c => (c.id === cv.id ? { ...c, visible } : c)))
    try {
      await setCvVisibility(cv.id, visible)
    } catch {
      setCvs(prev => prev.map(c => (c.id === cv.id ? { ...c, visible: cv.visible } : c)))
      setError('Could not change the visibility.')
    }
  }

  const remove = async (cv: Cv): Promise<boolean> => {
    try {
      await deleteCv(cv.id)
      setCvs(prev => prev.filter(c => c.id !== cv.id))
      return true
    } catch {
      setError('Could not delete.')
      return false
    }
  }

  const create = async (name: string, fileUrl: string): Promise<boolean> => {
    try {
      await createCv(name, fileUrl)
      setError(null)
      await reload()
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not save.'))
      return false
    }
  }

  return { cvs, loading, error, move, toggleVisibility, remove, create }
}
