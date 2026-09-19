import { getJson, send, sendJson } from '../../shared/api/http'
import { documentStore } from '../../shared/api/documents'
import type { DocumentStore } from '../../shared/domain/document'
import type { TicketStatus } from './status'
import type { Ticket, TicketInfo, TicketNote } from './types'

function ticketPath(id: string): string {
  return `/tickets/${id}`
}

export function ticketDocuments(id: string): DocumentStore {
  return documentStore(ticketPath(id))
}

export function listTicketsByFeature(featureId: string, signal?: AbortSignal): Promise<Ticket[]> {
  return getJson<Ticket[]>(`/tickets/by-feature/${featureId}`, signal)
}

export function createTicket(featureId: string, info: TicketInfo): Promise<Ticket> {
  return sendJson<Ticket>('/tickets', { method: 'POST', body: { featureId, ...info } })
}

export function updateTicket(id: string, info: TicketInfo): Promise<void> {
  return send(ticketPath(id), { method: 'PATCH', body: info })
}

export function deleteTicket(id: string): Promise<void> {
  return send(ticketPath(id), { method: 'DELETE' })
}

export function changeTicketStatus(id: string, status: TicketStatus): Promise<void> {
  return send(`${ticketPath(id)}/status`, { method: 'PATCH', body: { status } })
}

export function addTicketNote(id: string, note: string): Promise<TicketNote> {
  return sendJson<TicketNote>(`${ticketPath(id)}/notes`, { method: 'POST', body: { note } })
}

export function editTicketNote(id: string, noteId: string, note: string): Promise<TicketNote> {
  return sendJson<TicketNote>(`${ticketPath(id)}/notes/${noteId}`, { method: 'PATCH', body: { note } })
}
