import { useCallback, useEffect, useState } from 'react'
import { errorDetailOr } from '../../../shared/api/http'
import { decidePairingRequest, listPendingPairingRequests } from '../api'
import type { Decision } from '../../../shared/domain/decision'
import type { PairingRequest } from '../types'

export function usePairingRequests() {
  const [requests, setRequests] = useState<PairingRequest[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setRequests(await listPendingPairingRequests())
    } catch {
      setError('Could not load the pairing requests.')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const decide = async (id: string, decision: Decision): Promise<void> => {
    try {
      await decidePairingRequest(id, decision)
      await reload()
    } catch (err) {
      setError(errorDetailOr(err, 'Could not process the request.'))
    }
  }

  return { pending: requests, error, decide }
}
