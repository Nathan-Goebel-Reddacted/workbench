import { useEffect, useState } from 'react'
import { getSiteAccess, setSiteAccess } from '../api'

export function useSiteAccess() {
  const [open, setOpen] = useState<boolean | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getSiteAccess(controller.signal)
      .then(access => setOpen(access.open))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const toggle = async (): Promise<boolean> => {
    if (open === null) return false
    const next = !open
    setOpen(next)
    try {
      await setSiteAccess(next)
      return true
    } catch {
      setOpen(!next)
      return false
    }
  }

  return { open, toggle }
}
