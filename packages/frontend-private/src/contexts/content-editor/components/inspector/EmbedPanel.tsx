import { useState } from 'react'
import type { EmbedComponent } from '@content'
import type { PanelProps } from './panelProps'
import { fieldStyle, inputStyle, labelStyle, panelStyle } from './panelStyles'

export function EmbedPanel({ value, onChange }: PanelProps<'embed'>) {
  const [draft, setDraft] = useState({ url: value.url ?? '', title: value.title })

  const commit = () => {
    const next: EmbedComponent = { url: draft.url.trim() === '' ? null : draft.url.trim(), title: draft.title }
    if (next.url !== value.url || next.title !== value.title) onChange(next)
  }

  return (
    <div style={panelStyle}>
      <label style={fieldStyle}>
        <span style={labelStyle}>Address (https)</span>
        <input
          type="url"
          style={inputStyle}
          placeholder="https://…"
          value={draft.url}
          onChange={e => setDraft({ ...draft, url: e.target.value })}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
          }}
        />
      </label>
      <label style={fieldStyle}>
        <span style={labelStyle}>Title (for screen readers)</span>
        <input
          style={inputStyle}
          value={draft.title}
          onChange={e => setDraft({ ...draft, title: e.target.value })}
          onBlur={commit}
        />
      </label>
    </div>
  )
}
