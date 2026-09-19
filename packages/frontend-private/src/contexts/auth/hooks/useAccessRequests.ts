import { useCallback, useEffect, useState } from 'react'
import { errorDetailOr } from '../../../shared/api/http'
import { decideAccessRequest, listPendingAccessRequests } from '../api'
import type { Decision } from '../../../shared/domain/decision'
import type { AccessRequest } from '../types'

export function useAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setRequests(await listPendingAccessRequests())
    } catch {
      setError('Could not load the access requests.')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const decide = async (email: string, decision: Decision): Promise<void> => {
    try {
      await decideAccessRequest(email, decision)
      await reload()
    } catch (err) {
      setError(errorDetailOr(err, 'Could not process the request.'))
    }
  }

  return { pending: requests, error, decide }
}
