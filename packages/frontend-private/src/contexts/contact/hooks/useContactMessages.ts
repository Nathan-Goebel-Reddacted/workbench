import { useCallback, useEffect, useState } from 'react'
import { deleteAllContactMessages, deleteContactMessage, listContactMessages } from '../api'
import type { ContactMessage } from '../types'

export function useContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setMessages(await listContactMessages())
    } catch {
      setError('Could not load the messages.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (deletion: () => Promise<void>): Promise<void> => {
    setError(null)
    try {
      await deletion()
      await load()
    } catch {
      setError('Deletion failed.')
    }
  }

  return {
    messages,
    error,
    loading,
    remove: (id: string) => run(() => deleteContactMessage(id)),
    removeAll: () => run(deleteAllContactMessages),
  }
}
