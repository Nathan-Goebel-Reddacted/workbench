import { useState, type CSSProperties } from 'react'
import { Button } from '@atelier/shared-ui'
import type { LinkListComponent, LinkListItem, LinkListStyle } from '@content'
import { MediaPicker } from '../MediaPicker'
import { ColorChoice } from './ColorChoice'
import type { PanelProps } from './panelProps'
import { fieldStyle, fileStyle, inputStyle, labelStyle, panelStyle, rowStyle } from './panelStyles'

const STYLES: { value: LinkListStyle; label: string }[] = [
  { value: 'link', label: 'Text links' },
  { value: 'solid', label: 'Solid buttons' },
  { value: 'outline', label: 'Outline buttons' },
]

type Draft = { url: string; label: string }

export function LinkListPanel({ value, onChange }: PanelProps<'linkList'>) {
  const [drafts, setDrafts] = useState<Draft[]>(value.links.map(toDraft))
  const [pickingLogo, setPickingLogo] = useState<number | null>(null)

  const save = (next: Partial<LinkListComponent>) => {
    if (next.links) setDrafts(next.links.map(toDraft))
    onChange({ ...value, ...next })
  }
  const replace = (index: number, link: LinkListItem) =>
    save({ links: value.links.map((it, i) => (i === index ? link : it)) })

  const commit = (index: number) => {
    const draft = drafts[index]
    const link = value.links[index]
    if (!draft || !link) return
    const url = draft.url.trim() === '' ? null : draft.url.trim()
    if (url !== link.url || draft.label !== link.label) replace(index, { ...link, url, label: draft.label })
  }

  return (
    <div style={panelStyle}>
      <label style={fieldStyle}>
        <span style={labelStyle}>Style</span>
        <select style={inputStyle} value={value.style} onChange={e => save({ style: e.target.value as LinkListStyle })}>
          {STYLES.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <ColorChoice label="Text colour" value={value.color} onChange={color => save({ color })} />
      {value.style === 'solid' && <ColorChoice label="Fill" value={value.fill} onChange={fill => save({ fill })} />}

      {value.links.map((link, index) => (
        <div key={index} style={linkStyle}>
          <input
            type="url"
            style={inputStyle}
            placeholder="https://…"
            value={drafts[index]?.url ?? ''}
            onChange={e => setDrafts(prev => prev.map((d, i) => (i === index ? { ...d, url: e.target.value } : d)))}
            onBlur={() => commit(index)}
          />
          <input
            style={inputStyle}
            placeholder="Label"
            value={drafts[index]?.label ?? ''}
            onChange={e => setDrafts(prev => prev.map((d, i) => (i === index ? { ...d, label: e.target.value } : d)))}
            onBlur={() => commit(index)}
          />
          <div style={rowStyle}>
            <span style={fileStyle}>{link.logo ?? 'No logo'}</span>
            <Button variant="secondary" onClick={() => setPickingLogo(index)}>
              Logo
            </Button>
            {link.logo && (
              <Button variant="ghost" onClick={() => replace(index, { ...link, logo: null })}>
                No logo
              </Button>
            )}
          </div>
          <div style={rowStyle}>
            <label style={checkStyle}>
              <input
                type="checkbox"
                checked={link.newTab}
                onChange={e => replace(index, { ...link, newTab: e.target.checked })}
              />
              New tab
            </label>
            <Button variant="ghost" onClick={() => save({ links: value.links.filter((_, i) => i !== index) })}>
              Remove
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="secondary"
        onClick={() => save({ links: [...value.links, { url: null, label: '', logo: null, newTab: true }] })}
      >
        Add a link
      </Button>

      {pickingLogo !== null && (
        <MediaPicker
          kind="image"
          selectedUrl={value.links[pickingLogo]?.logo ?? ''}
          onSelect={url => {
            const link = value.links[pickingLogo]
            setPickingLogo(null)
            if (link) replace(pickingLogo, { ...link, logo: url })
          }}
          onClose={() => setPickingLogo(null)}
        />
      )}
    </div>
  )
}

function toDraft(link: LinkListItem): Draft {
  return { url: link.url ?? '', label: link.label }
}

const linkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid var(--color-border)',
}
const checkStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
}
