import { useState } from 'react'
import { errorDetailOr } from '../../../shared/api/http'
import { deleteFeature, updateFeature } from '../api'
import type { FeatureInfo } from '../types'

export function useFeature(featureId: string) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (info: FeatureInfo): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      await updateFeature(featureId, info)
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not save.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  const remove = async (): Promise<boolean> => {
    setDeleting(true)
    setError(null)
    try {
      await deleteFeature(featureId)
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not delete.'))
      return false
    } finally {
      setDeleting(false)
    }
  }

  return { saving, deleting, error, save, remove }
}
