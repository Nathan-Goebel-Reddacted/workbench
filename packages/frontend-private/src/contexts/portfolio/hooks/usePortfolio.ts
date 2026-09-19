import { useEffect, useState } from 'react'
import { isAbort } from '../../../shared/api/errors'
import { getPortfolio } from '../api'
import type { Portfolio } from '../types'

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    getPortfolio(controller.signal)
      .then(data => {
        setPortfolio(data)
        setLoading(false)
      })
      .catch(err => {
        if (!isAbort(err)) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return { portfolio, loading }
}
