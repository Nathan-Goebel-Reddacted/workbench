import { useState, type CSSProperties } from 'react'
import { Button } from '@atelier/shared-ui'
import {
  IMAGE_FIT_OPTIONS,
  IMAGE_POSITION_OPTIONS,
  type ImageFit,
  type ImagePosition,
  type MediaComponent,
  type MediaFileRef,
} from '@content'
import { MediaPicker } from '../MediaPicker'
import type { PanelProps } from './panelProps'
import { fieldStyle, fileStyle, inputStyle, labelStyle, panelStyle, rowStyle } from './panelStyles'
import { useDraft } from './useDraft'

const MAX_FILES = 20

type Picking = { index: number } | 'new' | null

export function MediaPanel({ value, onChange, beginInteraction, showSlide }: PanelProps<'media'>) {
  const { draft, update } = useDraft<MediaComponent>(value, onChange, beginInteraction)
  const [picking, setPicking] = useState<Picking>(null)
  const files = draft.files

  const setFiles = (next: MediaFileRef[]) => update({ ...draft, files: next })
  const setFile = (index: number, patch: Partial<MediaFileRef>) =>
    setFiles(files.map((file, i) => (i === index ? { ...file, ...patch } : file)))
  const move = (index: number, to: number) => {
    const next = [...files]
    const [file] = next.splice(index, 1)
    next.splice(to, 0, file)
    setFiles(next)
    showSlide(to)
  }
  const choose = (url: string) => {
    if (picking === 'new') {
      setFiles([...files, { url, alt: '' }])
      showSlide(files.length)
    } else if (picking) {
      setFile(picking.index, { url })
      showSlide(picking.index)
    }
    setPicking(null)
  }

  return (
    <div style={panelStyle}>
      <span style={labelStyle}>Files</span>
      {files.length === 0 && <span style={fileStyle}>No file chosen</span>}
      {files.map((file, index) => (
        <div key={index} style={fileBoxStyle}>
          <div style={rowStyle}>
            <button type="button" style={fileButtonStyle} title="Show on the canvas" onClick={() => showSlide(index)}>
              {index + 1}. {file.url ?? 'No file'}
            </button>
            <Button variant="ghost" onClick={() => setPicking({ index })}>
              Change
            </Button>
          </div>
          <input
            style={inputStyle}
            placeholder="Alternative text"
            maxLength={300}
            value={file.alt}
            onChange={e => setFile(index, { alt: e.target.value })}
          />
          <div style={rowStyle}>
            <Button variant="ghost" disabled={index === 0} onClick={() => move(index, index - 1)}>
              Up
            </Button>
            <Button variant="ghost" disabled={index === files.length - 1} onClick={() => move(index, index + 1)}>
              Down
            </Button>
            <Button variant="ghost" onClick={() => setFiles(files.filter((_, i) => i !== index))}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" disabled={files.length >= MAX_FILES} onClick={() => setPicking('new')}>
        Add a file
      </Button>
      <label style={fieldStyle}>
        <span style={labelStyle}>Fit</span>
        <select
          style={inputStyle}
          value={draft.fit}
          onChange={e => update({ ...draft, fit: e.target.value as ImageFit })}
        >
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
          value={draft.position}
          onChange={e => update({ ...draft, position: e.target.value as ImagePosition })}
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
          selectedUrl={picking === 'new' ? '' : (files[picking.index]?.url ?? '')}
          onSelect={choose}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

const fileBoxStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid var(--color-border)',
}
const fileButtonStyle: CSSProperties = {
  ...fileStyle,
  textAlign: 'left',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
}
