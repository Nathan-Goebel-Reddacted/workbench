import { useEffect, useState } from 'react'
import { Button, Modal } from '@atelier/shared-ui'
import {
  API_URL,
  choiceLabelStyle,
  choiceStyle,
  errorStyle,
  hintStyle,
  inputStyle,
  mutedStyle,
  reportRowStyle,
  selectedChoiceStyle,
} from './ioStyles'

type Mode = 'file' | 'ioport'

type Report = {
  source: string
  uploadsRestored: boolean
  tables: { table: string; inserted: number; updated: number }[]
}

async function sendImport(mode: Mode, file: File | null, dump: string): Promise<Response> {
  if (mode === 'ioport') {
    return fetch(`${API_URL}/io/import`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: dump }),
    })
  }

  const isZip = file!.name.toLowerCase().endsWith('.zip')
  return fetch(`${API_URL}/io/import`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': isZip ? 'application/zip' : 'application/sql' },
    body: isZip ? file! : await file!.text(),
  })
}

export function ImportModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [dumps, setDumps] = useState<string[]>([])
  const [dump, setDump] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/io/dumps`, { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? (res.json() as Promise<{ dumps: string[] }>) : null))
      .then(data => {
        if (!data) return
        setDumps(data.dumps)
        setDump(data.dumps[data.dumps.length - 1] ?? '')
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const ready = mode === 'file' ? file !== null : dump !== ''

  const handleImport = async () => {
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      const res = await sendImport(mode, file, dump)
      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        throw new Error(detail?.message ?? `Import refusé (${res.status})`)
      }
      setReport((await res.json()) as Report)
      setConfirming(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const total = report?.tables.reduce(
    (sum, row) => ({ inserted: sum.inserted + row.inserted, updated: sum.updated + row.updated }),
    { inserted: 0, updated: 0 },
  )

  return (
    <Modal
      id="import-data"
      open
      closeLabel="Fermer"
      title="Importer des données"
      onClose={onClose}
      footer={
        report ? (
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        ) : confirming ? (
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleImport} disabled={busy}>
              {busy ? 'Import…' : 'Confirmer l’import'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
            <Button variant="primary" onClick={() => setConfirming(true)} disabled={!ready}>
              Importer
            </Button>
          </>
        )
      }
    >
      {report ? (
        <>
          <p style={{ ...mutedStyle, marginBottom: '0.75rem' }}>
            Importé depuis {report.source} — médias {report.uploadsRestored ? 'restaurés' : 'non fournis'}
          </p>
          {report.tables.map(row => (
            <div key={row.table} style={reportRowStyle}>
              <span>{row.table}</span>
              <span style={mutedStyle}>
                +{row.inserted} insérées · ~{row.updated} mises à jour
              </span>
            </div>
          ))}
          <div style={{ ...reportRowStyle, borderBottom: 'none', fontWeight: 600 }}>
            <span>total</span>
            <span>
              +{total!.inserted} insérées · ~{total!.updated} mises à jour
            </span>
          </div>
        </>
      ) : confirming ? (
        <p style={mutedStyle}>
          L’import écrase les lignes portant le même identifiant et ajoute les autres. Rien n’est supprimé, mais les
          modifications faites depuis cet export seront perdues sur les lignes concernées. Confirmer ?
        </p>
      ) : (
        <>
          <label style={mode === 'file' ? selectedChoiceStyle : choiceStyle}>
            <input type="radio" name="import-mode" checked={mode === 'file'} onChange={() => setMode('file')} />
            <span style={{ flex: 1 }}>
              <span style={choiceLabelStyle}>Depuis un fichier</span>
              <span style={{ ...hintStyle, display: 'block' }}>
                Un zip d’export (base et médias) ou un dump .sql seul
              </span>
              {mode === 'file' && (
                <input
                  type="file"
                  accept=".zip,.sql"
                  style={{ ...inputStyle, marginTop: '0.625rem' }}
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              )}
            </span>
          </label>

          <label style={mode === 'ioport' ? selectedChoiceStyle : choiceStyle}>
            <input type="radio" name="import-mode" checked={mode === 'ioport'} onChange={() => setMode('ioport')} />
            <span style={{ flex: 1 }}>
              <span style={choiceLabelStyle}>Depuis ioPort/</span>
              <span style={{ ...hintStyle, display: 'block' }}>
                {dumps.length > 0 ? 'Un dump déjà déposé dans le dossier d’échange' : 'Aucun dump déposé dans ioPort/'}
              </span>
              {mode === 'ioport' && dumps.length > 0 && (
                <select
                  value={dump}
                  onChange={e => setDump(e.target.value)}
                  style={{ ...inputStyle, marginTop: '0.625rem' }}
                >
                  {dumps.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </span>
          </label>
        </>
      )}

      {error && <p style={errorStyle}>{error}</p>}
    </Modal>
  )
}
