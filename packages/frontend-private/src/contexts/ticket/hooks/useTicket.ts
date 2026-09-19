import { useMemo, useState } from 'react'
import { errorDetailOr } from '../../../shared/api/errors'
import { addTicketNote, changeTicketStatus, deleteTicket, editTicketNote, ticketDocuments, updateTicket } from '../api'
import type { TicketStatus } from '../status'
import type { Ticket, TicketInfo } from '../types'

export function useTicket(ticket: Ticket, onUpdate: (updated: Partial<Ticket>) => void) {
  const documents = useMemo(() => ticketDocuments(ticket.id), [ticket.id])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const attempt = async (action: () => Promise<void>, fallback: string): Promise<boolean> => {
    setError(null)
    try {
      await action()
      return true
    } catch (err) {
      setError(errorDetailOr(err, fallback))
      return false
    }
  }

  const changeStatus = (status: TicketStatus): Promise<boolean> =>
    attempt(async () => {
      await changeTicketStatus(ticket.id, status)
      onUpdate({ status })
    }, 'Could not change the status.')

  const save = async (info: TicketInfo): Promise<boolean> => {
    setSaving(true)
    try {
      return await attempt(async () => {
        await updateTicket(ticket.id, info)
        onUpdate(info)
      }, 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (): Promise<boolean> => {
    setDeleting(true)
    try {
      return await attempt(() => deleteTicket(ticket.id), 'Could not delete.')
    } finally {
      setDeleting(false)
    }
  }

  const addNote = (note: string): Promise<boolean> =>
    attempt(async () => {
      const added = await addTicketNote(ticket.id, note)
      onUpdate({ notes: [...ticket.notes, added] })
    }, 'Could not add the note.')

  const editNote = (noteId: string, note: string): Promise<boolean> =>
    attempt(async () => {
      const edited = await editTicketNote(ticket.id, noteId, note)
      onUpdate({ notes: ticket.notes.map(n => (n.id === noteId ? edited : n)) })
    }, 'Could not edit the note.')

  return { documents, saving, deleting, error, changeStatus, save, remove, addNote, editNote }
}
