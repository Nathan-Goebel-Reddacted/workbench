export const ORIGINS = ['front', 'back'] as const

export type Origin = (typeof ORIGINS)[number]

export type ErrorLogEntry = {
  id: string
  origin: Origin
  message: string
  stack: string | null
  url: string | null
  userId: string | null
  correlationId: string | null
  context: Record<string, unknown>
  occurredAt: string
}

export type ErrorLogSlice = { entries: ErrorLogEntry[]; total: number }
