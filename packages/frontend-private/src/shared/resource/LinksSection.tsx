import type { CSSProperties } from 'react'
import { useState, Fragment } from 'react'
import { Button } from '@atelier/shared-ui'
import { FileUpload } from '../components/FileUpload'
import { useCanEdit } from '../auth/EditPermissionContext'
import type { Link, LinkStore } from '../domain/link'
import { useLinks } from './useLinks'

type PageReplacement = {
  replacingUrl: string | null
  onChange(url: string | null): void
}

type Props = {
  store: LinkStore
  initialLinks: Link[]
  pageReplacement?: PageReplacement
}

export function LinksSection({ store, initialLinks, pageReplacement }: Props) {
  const canEdit = useCanEdit()
  const { links, error, add, remove } = useLinks(store, initialLinks)
  const [url, setUrl] = useState('')
  const [displayText, setDisplayText] = useState('')
  const [logo, setLogo] = useState('')

  const handleAdd = async () => {
    if (!(await add({ url, displayText, logo }))) return
    setUrl('')
    setDisplayText('')
    setLogo('')
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
            <div style={cellStyle}>
              {pageReplacement && (
                <Button
                  variant={pageReplacement.replacingUrl === l.url ? 'primary' : 'ghost'}
                  onClick={() => pageReplacement.onChange(pageReplacement.replacingUrl === l.url ? null : l.url)}
                  disabled={!canEdit}
                  title="Visitors reach this link instead of the project page"
                >
                  {pageReplacement.replacingUrl === l.url ? 'Replaces page' : 'Use as page'}
                </Button>
              )}
            </div>
            <div style={{ ...cellStyle, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => remove(l)} disabled={!canEdit}>
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
        <FileUpload accept="image/*" label="📁" onUploaded={setLogo} disabled={!canEdit} />
        <Button variant="primary" onClick={handleAdd} disabled={!canEdit || !url.trim()}>
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
