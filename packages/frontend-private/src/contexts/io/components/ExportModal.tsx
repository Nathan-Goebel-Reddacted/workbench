import { useState } from 'react'
import { Button, Modal } from '@atelier/shared-ui'
import { choiceLabelStyle, choiceStyle, errorStyle, hintStyle, mutedStyle, selectedChoiceStyle } from './ioStyles'
import { useExport } from '../hooks/useExport'
import type { ExportTarget } from '../types'

type TargetChoice = { value: ExportTarget; label: string; hint: string }

const TARGETS: TargetChoice[] = [
  {
    value: 'download',
    label: 'Download',
    hint: 'A dated zip holding the SQL dump and the media, importable as is',
  },
  {
    value: 'ioport',
    label: 'Drop into ioPort/',
    hint: 'The dump and the media archive side by side, like make db-export',
  },
  {
    value: 'backup',
    label: 'Archive into backup/',
    hint: 'backup/DDMMYYYY.zip — suffixed -2, -3… when the date is already taken',
  },
]

export function ExportModal({ onClose }: { onClose: () => void }) {
  const [target, setExportTarget] = useState<ExportTarget>('download')
  const { busy, error, result, run } = useExport()

  const handleExport = () => run(target)

  return (
    <Modal
      id="export-data"
      open
      closeLabel="Close"
      title="Export data"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={busy}>
            {busy ? 'Export…' : 'Export'}
          </Button>
        </>
      }
    >
      <p style={{ ...mutedStyle, marginBottom: '1rem' }}>
        The exported content is always the same — database and media. Only the destination changes.
      </p>

      {TARGETS.map(choice => (
        <label key={choice.value} style={target === choice.value ? selectedChoiceStyle : choiceStyle}>
          <input
            type="radio"
            name="export-target"
            checked={target === choice.value}
            onChange={() => setExportTarget(choice.value)}
          />
          <span>
            <span style={choiceLabelStyle}>{choice.label}</span>
            <span style={{ ...hintStyle, display: 'block' }}>{choice.hint}</span>
          </span>
        </label>
      ))}

      {error && <p style={errorStyle}>{error}</p>}

      {result && (
        <p style={{ ...mutedStyle, marginTop: '0.75rem' }}>
          {result.target === 'download'
            ? `Downloaded: ${result.filename}`
            : `Written: ${result.filename} — ${result.uploads} media file(s)`}
        </p>
      )}
    </Modal>
  )
}
