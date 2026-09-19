export type ExportTarget = 'download' | 'ioport' | 'backup'

export type ExportResult = { target: ExportTarget; filename: string; uploads: number }

export type ImportReport = {
  source: string
  uploadsRestored: boolean
  tables: { table: string; inserted: number; updated: number }[]
}
