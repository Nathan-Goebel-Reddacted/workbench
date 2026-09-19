import { useEffect, useState } from 'react'
import { Button, Modal } from '@atelier/shared-ui'
import {
  choiceLabelStyle,
  choiceStyle,
  errorStyle,
  hintStyle,
  inputStyle,
  mutedStyle,
  reportRowStyle,
  selectedChoiceStyle,
} from './ioStyles'
import { useImport } from '../hooks/useImport'

type Mode = 'file' | 'ioport'

export function ImportModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [dump, setDump] = useState('')
  const [confirming, setConfirming] = useState(false)
  const { dumps, busy, error, report, run } = useImport()

  useEffect(() => {
    setDump(dumps[dumps.length - 1] ?? '')
  }, [dumps])

  const ready = mode === 'file' ? file !== null : dump !== ''

  const handleImport = async () => {
    const source = mode === 'ioport' ? { kind: 'ioport' as const, dump } : file && { kind: 'file' as const, file }
    if (source && (await run(source))) setConfirming(false)
  }

  const total = report?.tables.reduce(
    (sum, row) => ({ inserted: sum.inserted + row.inserted, updated: sum.updated + row.updated }),
    { inserted: 0, updated: 0 },
  )

  return (
    <Modal
      id="import-data"
      open
      closeLabel="Close"
      title="Import data"
      onClose={onClose}
      footer={
        report ? (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        ) : confirming ? (
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleImport} disabled={busy}>
              {busy ? 'Import…' : 'Confirm import'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setConfirming(true)} disabled={!ready}>
              Import
            </Button>
          </>
        )
      }
    >
      {report ? (
        <>
          <p style={{ ...mutedStyle, marginBottom: '0.75rem' }}>
            Imported from {report.source} — media {report.uploadsRestored ? 'restored' : 'not provided'}
          </p>
          {report.tables.map(row => (
            <div key={row.table} style={reportRowStyle}>
              <span>{row.table}</span>
              <span style={mutedStyle}>
                +{row.inserted} inserted · ~{row.updated} updated
              </span>
            </div>
          ))}
          <div style={{ ...reportRowStyle, borderBottom: 'none', fontWeight: 600 }}>
            <span>total</span>
            <span>
              +{total!.inserted} inserted · ~{total!.updated} updated
            </span>
          </div>
        </>
      ) : confirming ? (
        <p style={mutedStyle}>
          The import overwrites the rows sharing an identifier and adds the others. Nothing is deleted, but the changes
          made since this export will be lost on the affected rows. Confirm?
        </p>
      ) : (
        <>
          <label style={mode === 'file' ? selectedChoiceStyle : choiceStyle}>
            <input type="radio" name="import-mode" checked={mode === 'file'} onChange={() => setMode('file')} />
            <span style={{ flex: 1 }}>
              <span style={choiceLabelStyle}>From a file</span>
              <span style={{ ...hintStyle, display: 'block' }}>
                An export zip (database and media) or a bare .sql dump
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
              <span style={choiceLabelStyle}>From ioPort/</span>
              <span style={{ ...hintStyle, display: 'block' }}>
                {dumps.length > 0 ? 'A dump already dropped in the exchange folder' : 'No dump in ioPort/'}
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
