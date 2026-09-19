import { useCallback, useEffect, useState } from 'react'
import { listErrorLog, purgeErrorLog } from '../api'
import type { ErrorLogEntry, Origin } from '../types'

const PAGE_SIZE = 50

export type ErrorLogFilters = {
  origin: '' | Origin
  from: string
  to: string
  q: string
}

export const EMPTY_FILTERS: ErrorLogFilters = { origin: '', from: '', to: '', q: '' }

function endOfDay(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString()
}

function buildQuery(filters: ErrorLogFilters, offset: number): string {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
  if (filters.origin) params.set('origin', filters.origin)
  if (filters.from) params.set('from', new Date(filters.from).toISOString())
  if (filters.to) params.set('to', endOfDay(filters.to))
  if (filters.q.trim()) params.set('q', filters.q.trim())
  return params.toString()
}

export function useErrorLog() {
  const [applied, setApplied] = useState<ErrorLogFilters>(EMPTY_FILTERS)
  const [offset, setOffset] = useState(0)
  const [entries, setEntries] = useState<ErrorLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listErrorLog(buildQuery(applied, offset))
      setEntries(data.entries)
      setTotal(data.total)
    } catch {
      setError('Could not load the log.')
    } finally {
      setLoading(false)
    }
  }, [applied, offset])

  useEffect(() => {
    void load()
  }, [load])

  const apply = (filters: ErrorLogFilters) => {
    setOffset(0)
    setApplied(filters)
  }

  const purge = async (): Promise<void> => {
    setError(null)
    try {
      await purgeErrorLog(applied.to ? endOfDay(applied.to) : null)
      setOffset(0)
      await load()
    } catch {
      setError('Purge failed.')
    }
  }

  return {
    entries,
    total,
    offset,
    pageSize: PAGE_SIZE,
    applied,
    error,
    loading,
    apply,
    purge,
    previousPage: () => setOffset(Math.max(offset - PAGE_SIZE, 0)),
    nextPage: () => setOffset(offset + PAGE_SIZE),
  }
}
