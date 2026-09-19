import { useEffect, useState } from 'react'
import { listProviders, providerLoginUrl } from '../api'
import type { Provider } from '../types'

export function useLoginProviders() {
  const [providers, setProviders] = useState<Provider[] | null>(null)

  useEffect(() => {
    listProviders()
      .then(setProviders)
      .catch(() => setProviders([]))
  }, [])

  return { providers, loginUrl: providerLoginUrl }
}
