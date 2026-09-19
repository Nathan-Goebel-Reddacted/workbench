import type { TicketStatus } from '../status'

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  finished: 'Done',
}
