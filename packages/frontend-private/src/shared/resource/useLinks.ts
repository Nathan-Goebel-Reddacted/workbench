import { useState } from 'react'
import { errorDetailOr } from '../api/http'
import type { Link, LinkStore } from '../domain/link'

export function useLinks(store: LinkStore, initialLinks: Link[]) {
  const [links, setLinks] = useState<Link[]>(initialLinks)
  const [error, setError] = useState<string | null>(null)

  const add = async (link: Link): Promise<boolean> => {
    setError(null)
    try {
      await store.add(link)
      setLinks(prev => [...prev, link])
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not add.'))
      return false
    }
  }

  const remove = async (link: Link): Promise<void> => {
    try {
      await store.remove(link)
      setLinks(prev => prev.filter(l => l.url !== link.url))
    } catch (err) {
      setError(errorDetailOr(err, 'Could not delete.'))
    }
  }

  return { links, error, add, remove }
}
