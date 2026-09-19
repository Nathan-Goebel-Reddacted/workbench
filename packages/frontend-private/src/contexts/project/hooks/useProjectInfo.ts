import { useState } from 'react'
import { errorDetailOr } from '../../../shared/api/http'
import { updateProjectInfo } from '../api'
import type { ProjectInfo } from '../types'

export function useProjectInfo(projectId: string) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const save = async (info: ProjectInfo): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      await updateProjectInfo(projectId, info)
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
