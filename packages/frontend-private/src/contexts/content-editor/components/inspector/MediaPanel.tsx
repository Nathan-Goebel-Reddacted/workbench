import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import {
  IMAGE_FIT_OPTIONS,
  IMAGE_POSITION_OPTIONS,
  type ImageFit,
  type ImagePosition,
  type MediaComponent,
} from '@content'
import { MediaPicker } from '../MediaPicker'
import type { PanelProps } from './panelProps'
import { fieldStyle, fileStyle, inputStyle, labelStyle, panelStyle, rowStyle } from './panelStyles'

export function MediaPanel({ value, onChange }: PanelProps<'media'>) {
  const [picking, setPicking] = useState(false)
  const [alt, setAlt] = useState(value.alt)
  const save = (next: Partial<MediaComponent>) => onChange({ ...value, ...next })

  return (
    <div style={panelStyle}>
      <div style={rowStyle}>
        <span style={fileStyle}>{value.url ?? 'No file chosen'}</span>
        <Button variant="secondary" onClick={() => setPicking(true)}>
          {value.url ? 'Change' : 'Choose'}
        </Button>
      </div>
      <label style={fieldStyle}>
        <span style={labelStyle}>Alternative text</span>
        <input
          style={inputStyle}
          value={alt}
          onChange={e => setAlt(e.target.value)}
          onBlur={() => {
            if (alt !== value.alt) save({ alt })
          }}
        />
      </label>
      <label style={fieldStyle}>
        <span style={labelStyle}>Fit</span>
        <select style={inputStyle} value={value.fit} onChange={e => save({ fit: e.target.value as ImageFit })}>
          {IMAGE_FIT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label style={fieldStyle}>
        <span style={labelStyle}>Position</span>
        <select
          style={inputStyle}
          value={value.position}
          onChange={e => save({ position: e.target.value as ImagePosition })}
        >
          {IMAGE_POSITION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {picking && (
        <MediaPicker
          kind="document"
          selectedUrl={value.url ?? ''}
          onSelect={url => {
            setPicking(false)
            save({ url })
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}
