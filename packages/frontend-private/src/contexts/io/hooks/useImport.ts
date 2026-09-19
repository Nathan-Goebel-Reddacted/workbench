import { useEffect, useState } from 'react'
import { HttpError } from '../../../shared/api/http'
import { importDump, importFile, listDumps } from '../api'
import type { ImportReport } from '../types'

export type ImportSource = { kind: 'file'; file: File } | { kind: 'ioport'; dump: string }

export function useImport() {
  const [dumps, setDumps] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    listDumps(controller.signal)
      .then(setDumps)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const run = async (source: ImportSource): Promise<boolean> => {
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      setReport(source.kind === 'ioport' ? await importDump(source.dump) : await importFile(source.file))
      return true
    } catch (err) {
      setError(err instanceof HttpError ? (err.detail ?? `Import refused (${err.status})`) : (err as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  return { dumps, busy, error, report, run }
}
