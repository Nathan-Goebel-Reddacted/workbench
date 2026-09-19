import { useEffect, useState } from 'react'
import { errorDetailOr } from '../../../shared/api/errors'
import { createTicket, listTicketsByFeature } from '../api'
import type { Ticket, TicketInfo } from '../types'

export function useFeatureTickets(featureId: string) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    listTicketsByFeature(featureId, controller.signal)
      .then(data => {
        setTickets(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => controller.abort()
  }, [featureId])

  const create = async (info: TicketInfo): Promise<boolean> => {
    setError(null)
    try {
      const created = await createTicket(featureId, info)
      setTickets(prev => [...prev, created])
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not create the ticket.'))
      return false
    }
  }

  const patch = (id: string, updated: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)))
  }

  const forget = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  return { tickets, loading, error, create, patch, forget }
}
