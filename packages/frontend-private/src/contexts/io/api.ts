import { getJson, request, sendJson } from '../../shared/api/http'
import type { ExportTarget, ImportReport } from './types'

export function exportData(target: ExportTarget): Promise<Response> {
  return request('/io/export', { method: 'POST', body: { target } })
}

export async function listDumps(signal?: AbortSignal): Promise<string[]> {
  const { dumps } = await getJson<{ dumps: string[] }>('/io/dumps', signal)
  return dumps
}

export function importDump(dump: string): Promise<ImportReport> {
  return sendJson<ImportReport>('/io/import', { method: 'POST', body: { file: dump } })
}

export async function importFile(file: File): Promise<ImportReport> {
  const isZip = file.name.toLowerCase().endsWith('.zip')
  const response = await request('/io/import', {
    method: 'POST',
    body: isZip ? file : await file.text(),
    contentType: isZip ? 'application/zip' : 'application/sql',
  })
  return (await response.json()) as ImportReport
}
