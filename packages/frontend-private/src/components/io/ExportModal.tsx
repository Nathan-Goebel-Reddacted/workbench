import { useState } from 'react'
import { Button, Modal } from '@atelier/shared-ui'
import {
  API_URL,
  choiceLabelStyle,
  choiceStyle,
  errorStyle,
  hintStyle,
  mutedStyle,
  selectedChoiceStyle,
} from './ioStyles'

type Target = 'download' | 'ioport' | 'backup'

type TargetChoice = { value: Target; label: string; hint: string }

const TARGETS: TargetChoice[] = [
  {
    value: 'download',
    label: 'Télécharger',
    hint: 'Un zip daté contenant le dump SQL et les médias, réimportable tel quel',
  },
  {
    value: 'ioport',
    label: 'Déposer dans ioPort/',
    hint: 'Le dump et l’archive des médias côte à côte, comme make db-export',
  },
  {
    value: 'backup',
    label: 'Archiver dans backup/',
    hint: 'backup/JJMMAAAA.zip — suffixé -2, -3… si la date est déjà prise',
  },
]

type Result = { target: Target; filename: string; uploads: number }

function filenameFrom(disposition: string | null, fallback: string): string {
  const match = disposition?.match(/filename="([^"]+)"/)
  return match ? match[1] : fallback
}

export function ExportModal({ onClose }: { onClose: () => void }) {
  const [target, setTarget] = useState<Target>('download')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const handleExport = async () => {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/io/export`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      })

      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        throw new Error(detail?.message ?? `Export refusé (${res.status})`)
      }

      if (target === 'download') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filenameFrom(res.headers.get('content-disposition'), 'export.zip')
        link.click()
        URL.revokeObjectURL(url)
        setResult({ target, filename: link.download, uploads: 0 })
      } else {
        setResult((await res.json()) as Result)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      id="export-data"
      open
      closeLabel="Fermer"
      title="Exporter les données"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={busy}>
            {busy ? 'Export…' : 'Exporter'}
          </Button>
        </>
      }
    >
      <p style={{ ...mutedStyle, marginBottom: '1rem' }}>
        Le contenu exporté est toujours le même — base et médias. Seule la destination change.
      </p>

      {TARGETS.map(choice => (
        <label key={choice.value} style={target === choice.value ? selectedChoiceStyle : choiceStyle}>
          <input
            type="radio"
            name="export-target"
            checked={target === choice.value}
            onChange={() => setTarget(choice.value)}
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
            ? `Téléchargé : ${result.filename}`
            : `Écrit : ${result.filename} — ${result.uploads} fichier(s) média`}
        </p>
      )}
    </Modal>
  )
}
