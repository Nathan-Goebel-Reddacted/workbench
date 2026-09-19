import { useState } from 'react'
import { failureMessage } from '../../../shared/api/errors'
import { exportData } from '../api'
import type { ExportResult, ExportTarget } from '../types'

function filenameFrom(disposition: string | null, fallback: string): string {
  const match = disposition?.match(/filename="([^"]+)"/)
  return match ? match[1] : fallback
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function useExport() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExportResult | null>(null)

  const run = async (target: ExportTarget): Promise<void> => {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await exportData(target)

      if (target === 'download') {
        const filename = filenameFrom(res.headers.get('content-disposition'), 'export.zip')
        download(await res.blob(), filename)
        setResult({ target, filename, uploads: 0 })
      } else {
        setResult((await res.json()) as ExportResult)
      }
    } catch (err) {
      setError(failureMessage(err, 'Export refused.', 'Network error.'))
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, result, run }
}
