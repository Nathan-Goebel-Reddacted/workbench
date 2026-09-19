import type { CSSProperties } from 'react'
import { useState, Fragment } from 'react'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../components/FileUpload'
import { useCanEdit } from '../auth/EditPermissionContext'
import { MindmapModal } from '../mindmap/MindmapModal'
import { PreviewTooltip, isPreviewable, previewKind, usePreview } from './documentPreview'
import { useDocuments } from './useDocuments'
import type { Document, DocumentStore } from '../domain/document'

type Props = {
  store: DocumentStore
  initialDocuments: Document[]
}

export function DocumentsSection({ store, initialDocuments }: Props) {
  const canEdit = useCanEdit()
  const { documents: docs, error, add, remove, append } = useDocuments(store, initialDocuments)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const preview = usePreview()
  const [editing, setEditing] = useState<{ document?: Document } | null>(null)

  const handleAdd = async () => {
    if (!(await add(name, url))) return
    setName('')
    setUrl('')
  }

  return (
    <section style={sectionStyle}>
      <PreviewTooltip state={preview.state} onMouseEnter={preview.keep} onMouseLeave={preview.hide} />
      <p style={labelStyle}>Documents</p>
      {error && <p style={errorStyle}>{error}</p>}
      <div style={gridStyle}>
        {docs.map(d => {
          const kind = previewKind(d.url)
          const previewable = isPreviewable(kind)
          const isMindmap = kind === 'mindmap'
          return (
            <Fragment key={d.id}>
              <span
                style={{ ...cellStyle, ...(previewable ? namePreviawableStyle : {}) }}
                onMouseEnter={previewable ? e => preview.show(d.url, e) : undefined}
                onMouseLeave={previewable ? preview.hide : undefined}
              >
                {d.name}
              </span>
              <div style={cellStyle} />
              <div style={cellStyle} />
              <div style={{ ...cellStyle, display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                {isMindmap && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      preview.hideNow()
                      setEditing({ document: d })
                    }}
                    disabled={!canEdit}
                  >
                    Edit
                  </Button>
                )}
                <Button variant="ghost" onClick={() => remove(d.id)} disabled={!canEdit}>
                  Remove
                </Button>
              </div>
              <div style={separatorStyle} />
            </Fragment>
          )
        })}
        <input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={!canEdit}
          style={inputStyle}
        />
        <input
          placeholder="URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={!canEdit}
          style={inputStyle}
        />
        <FileUpload label="📁" onUploaded={u => setUrl(u)} disabled={!canEdit} />
        <Button variant="primary" onClick={handleAdd} disabled={!canEdit || !name.trim() || !url.trim()}>
          Add
        </Button>
      </div>

      <div style={mindmapActionStyle}>
        <Button variant="secondary" onClick={() => setEditing({})} disabled={!canEdit}>
          🧠 Nouveau mindmap
        </Button>
      </div>

      {editing && (
        <MindmapModal store={store} document={editing.document} onClose={() => setEditing(null)} onCreated={append} />
      )}
    </section>
  )
}

const sectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto auto',
  gap: '0.5rem',
  alignItems: 'center',
  marginTop: '0.25rem',
}
const cellStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  padding: '0.4rem 0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const separatorStyle: CSSProperties = {
  gridColumn: '1 / -1',
  height: '1px',
  backgroundColor: 'var(--color-border)',
}
const inputStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }
const mindmapActionStyle: CSSProperties = { marginTop: '0.75rem' }
const namePreviawableStyle: CSSProperties = {
  cursor: 'help',
  textDecoration: 'underline dotted',
  textDecorationColor: 'var(--color-text-muted)',
}
