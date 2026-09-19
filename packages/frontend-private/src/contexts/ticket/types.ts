import type { Document } from '../../shared/domain/document'
import type { TicketStatus } from './status'

export type TicketNote = { id: string; text: string }

export type Ticket = {
  id: string
  reference: string
  featureId: string
  title: string
  description: string
  status: TicketStatus
  statusLocked: boolean
  notes: TicketNote[]
  documents: Document[]
}

export type TicketInfo = { title: string; description: string }
