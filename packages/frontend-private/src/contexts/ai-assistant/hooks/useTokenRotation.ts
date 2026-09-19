import { useState } from 'react'
import { errorDetailOr } from '../../../shared/api/errors'
import { rotateAgentToolToken } from '../api'

export function useTokenRotation(toolId: string) {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rotate = async (): Promise<void> => {
    setError(null)
    try {
      setToken(await rotateAgentToolToken(toolId))
    } catch (err) {
      setError(errorDetailOr(err, 'Could not rotate the token.'))
    }
  }

  return { token, error, rotate }
}
