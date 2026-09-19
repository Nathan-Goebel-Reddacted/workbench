import type { CSSProperties } from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@atelier/shared-ui'
import { MindmapEditor } from './MindmapEditor'
import { useMindmapFile } from './useMindmapFile'
import type { Document, DocumentStore } from '../domain/document'

type Props = {
  store: DocumentStore
  document?: Document
  onClose: () => void
  onCreated?: (document: Document) => void
}

export function MindmapModal({ store, document: existing, onClose, onCreated }: Props) {
  const isEdition = Boolean(existing)

  const [name, setName] = useState(existing?.name ?? 'Mindmap')
  const { loaded, saving, error, track, save } = useMindmapFile(store, existing, onCreated)

  const handleSave = async () => {
    if (await save(name)) onClose()
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <input
            style={nameInputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Mindmap name"
            disabled={isEdition}
          />
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={bodyStyle}>
          {loaded === null ? <p style={mutedStyle}>Loading…</p> : <MindmapEditor initial={loaded} onChange={track} />}
        </div>

        <div style={footerStyle}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || loaded === null || !name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>,
    window.document.body,
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  backgroundColor: 'var(--color-bg)',
  opacity: 0.98,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
}
const modalStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '1100px',
  height: '100%',
  maxHeight: '90vh',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1rem',
  gap: '0.75rem',
  boxSizing: 'border-box',
}
const headerStyle: CSSProperties = { display: 'flex', gap: '0.75rem', alignItems: 'center' }
const nameInputStyle: CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  fontSize: '0.95rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}
const bodyStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex' }
const footerStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }
const errorStyle: CSSProperties = { fontSize: '0.85rem', color: 'var(--color-primary)', margin: 0 }
const mutedStyle: CSSProperties = { fontSize: '0.85rem', color: 'var(--color-text-muted)' }
