import { useEffect, useState } from 'react'
import { errorDetailOr, isAbort } from '../../../shared/api/errors'
import { createFeature, listFeaturesByOwner } from '../api'
import type { Feature, FeatureInfo, OwnerType } from '../types'

export function useFeatures(ownerType: OwnerType, ownerId: string) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    listFeaturesByOwner(ownerType, ownerId, controller.signal)
      .then(data => {
        setFeatures(data)
        setLoading(false)
      })
      .catch(err => {
        if (isAbort(err)) return
        setError('Could not load the features.')
        setLoading(false)
      })
    return () => controller.abort()
  }, [ownerType, ownerId])

  const create = async (info: FeatureInfo): Promise<boolean> => {
    setError(null)
    try {
      await createFeature(ownerType, ownerId, info)
      setFeatures(await listFeaturesByOwner(ownerType, ownerId))
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not create.'))
      return false
    }
  }

  const forget = (id: string) => setFeatures(prev => prev.filter(f => f.id !== id))

  return { features, loading, error, create, forget }
}
