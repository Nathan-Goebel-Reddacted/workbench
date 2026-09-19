import { useState } from 'react'
import { errorDetailOr } from '../../../shared/api/http'
import { updateIdeaInfo } from '../api'
import type { IdeaInfo } from '../types'

export function useIdeaInfo(ideaId: string) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const save = async (info: IdeaInfo): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      await updateIdeaInfo(ideaId, info)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not save.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  return { saving, error, saved, save }
}
