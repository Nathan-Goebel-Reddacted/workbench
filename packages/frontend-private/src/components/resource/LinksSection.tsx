import type { CSSProperties } from 'react'
import { useState, Fragment } from 'react'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../../pages/project-detail/FileUpload'
import { useCanEdit } from '../../contexts/EditPermissionContext'

type Link = { url: string; displayText: string; logo: string }

type Props = {
  /** Chemin de la ressource porteuse, sans l'API_URL — ex. `/projects/{id}` ou `/ideas/{id}` */
  resourcePath: string
  initialLinks: Link[]
  apiUrl: string
}

export function LinksSection({ resourcePath, initialLinks, apiUrl }: Props) {
  const canEdit = useCanEdit()
  const [links, setLinks] = useState<Link[]>(initialLinks)
  const [url, setUrl] = useState('')
  const [displayText, setDisplayText] = useState('')
  const [logo, setLogo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const endpoint = `${apiUrl}${resourcePath}/links`

  const handleAdd = async () => {
    if (!url.trim()) {
      setError('URL requise.')
      return
    }
    setError(null)
    const link = { url: url.trim(), displayText: displayText.trim(), logo: logo.trim() }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(link),
    })
    if (res.ok || res.status === 204) {
      setLinks(prev => [...prev, link])
      setUrl('')
      setDisplayText('')
      setLogo('')
    } else {
      setError("Erreur lors de l'ajout.")
    }
  }

  const handleRemove = async (link: Link) => {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(link),
    })
    if (res.ok || res.status === 204) {
      setLinks(prev => prev.filter(l => l.url !== link.url))
    } else {
      setError('Erreur lors de la suppression.')
    }
  }

  return (
    <section style={sectionStyle}>
      <p style={labelStyle}>Links</p>
      {error && <p style={errorStyle}>{error}</p>}
      <div style={gridStyle}>
        {links.map(l => (
          <Fragment key={l.url}>
            <span style={cellStyle}>{l.displayText}</span>
            <span style={{ ...cellStyle, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{l.url}</span>
            <div style={cellStyle} />
            <div style={{ ...cellStyle, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => handleRemove(l)} disabled={!canEdit}>
                Remove
              </Button>
            </div>
            <div style={separatorStyle} />
          </Fragment>
        ))}
        <input
          placeholder="Display text"
          value={displayText}
          onChange={e => setDisplayText(e.target.value)}
          disabled={!canEdit}
          style={inputStyle}
        />
        <input
          placeholder="URL *"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={!canEdit}
          style={inputStyle}
        />
        <FileUpload apiUrl={apiUrl} accept="image/*" label="📁" onUploaded={setLogo} disabled={!canEdit} />
        <Button variant="primary" onClick={handleAdd} disabled={!canEdit}>
          Add
        </Button>
      </div>
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
  margin: '0',
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
