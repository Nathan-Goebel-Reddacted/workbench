import { useCallback, useEffect, useState } from 'react'
import { errorDetailOr } from '../../../shared/api/http'
import { allowEmail, disallowEmail, listAllowedEmails } from '../api'

export function useAllowedEmails(reloadKey: number) {
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setAllowedEmails(await listAllowedEmails())
    } catch {
      setError('Could not load the allowed emails.')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload, reloadKey])

  const allow = async (email: string): Promise<boolean> => {
    try {
      await allowEmail(email)
      await reload()
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not add.'))
      return false
    }
  }

  const disallow = async (email: string): Promise<void> => {
    try {
      await disallowEmail(email)
      setAllowedEmails(prev => prev.filter(e => e !== email))
    } catch {
      setError('Could not delete.')
    }
  }

  return { allowedEmails, error, allow, disallow }
}
