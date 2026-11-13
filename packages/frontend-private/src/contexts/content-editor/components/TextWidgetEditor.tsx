import type { CSSProperties } from 'react'
import { RichTextEditor } from './RichTextEditor'
import { TEXT_SCALE_OPTIONS, type TextContent, type TextScale } from '@content'

type Props = {
  value: TextContent
  onChange: (next: TextContent) => void
}

export function TextWidgetEditor({ value, onChange }: Props) {
  return (
    <>
      <label style={fieldStyle}>
        <span style={labelStyle}>Text size</span>
        <select
          style={selectStyle}
          value={value.scale}
          onChange={e => onChange({ ...value, scale: e.target.value as TextScale })}
        >
          {TEXT_SCALE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <RichTextEditor html={value.html} onChange={html => onChange({ ...value, html })} />
    </>
  )
}

const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
const selectStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
}
