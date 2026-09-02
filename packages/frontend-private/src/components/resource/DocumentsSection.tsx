import type { CSSProperties } from 'react'
import { useState, Fragment } from 'react'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../../pages/project-detail/FileUpload'
import { useCanEdit } from '../../contexts/EditPermissionContext'
import { MindmapModal } from '../mindmap/MindmapModal'
import { PreviewTooltip, isPreviewable, previewKind, usePreview } from './documentPreview'

type Doc = { id: string; name: string; url: string; type: string }

type Props = {
  /** Chemin de la ressource porteuse, sans l'API_URL — ex. `/projects/{id}` ou `/ideas/{id}` */
  resourcePath: string
  initialDocuments: Doc[]
  apiUrl: string
}

export function DocumentsSection({ resourcePath, initialDocuments, apiUrl }: Props) {
  const canEdit = useCanEdit()
  const [docs, setDocs] = useState<Doc[]>(initialDocuments)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const preview = usePreview()
  // null : modale fermée. undefined en `document` : création. Un Doc : ré-édition.
  const [editing, setEditing] = useState<{ document?: Doc } | null>(null)

  const endpoint = `${apiUrl}${resourcePath}/documents`

  const inferType = (fileUrl: string) => {
    const ext = fileUrl.slice(fileUrl.lastIndexOf('.') + 1).toLowerCase()
    return ext || 'file'
  }

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) {
      setError('Nom et URL requis.')
      return
    }
    setError(null)
    const type = inferType(url.trim())
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: name.trim(), url: url.trim(), type }),
    })
    if (res.ok || res.status === 204) {
      const tempId = crypto.randomUUID()
      setDocs(prev => [...prev, { id: tempId, name: name.trim(), url: url.trim(), type }])
      setName('')
      setUrl('')
    } else {
      setError("Erreur lors de l'ajout.")
    }
  }

  const handleRemove = async (docId: string) => {
    const res = await fetch(`${endpoint}/${docId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok || res.status === 204) {
      setDocs(prev => prev.filter(d => d.id !== docId))
    } else {
      setError('Erreur lors de la suppression.')
    }
  }

  return (
    <section style={sectionStyle}>
      <PreviewTooltip state={preview.state} apiUrl={apiUrl} onMouseEnter={preview.keep} onMouseLeave={preview.hide} />
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
                {/* Un mindmap est le seul document éditable dans l'application. */}
                {isMindmap && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      preview.hideNow()
                      setEditing({ document: d })
                    }}
                    disabled={!canEdit}
                  >
                    Éditer
                  </Button>
                )}
                <Button variant="ghost" onClick={() => handleRemove(d.id)} disabled={!canEdit}>
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
        <FileUpload apiUrl={apiUrl} label="📁" onUploaded={u => setUrl(u)} disabled={!canEdit} />
        <Button variant="primary" onClick={handleAdd} disabled={!canEdit}>
          Add
        </Button>
      </div>

      <div style={mindmapActionStyle}>
        <Button variant="secondary" onClick={() => setEditing({})} disabled={!canEdit}>
          🧠 Nouveau mindmap
        </Button>
      </div>

      {editing && (
        <MindmapModal
          apiUrl={apiUrl}
          resourcePath={resourcePath}
          document={editing.document}
          onClose={() => setEditing(null)}
          onCreated={created => setDocs(prev => [...prev, created])}
        />
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
