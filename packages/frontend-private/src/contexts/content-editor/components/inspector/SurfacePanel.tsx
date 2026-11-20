import type { CSSProperties } from 'react'
import type { SurfaceComponent } from '@content'
import { ColorChoice } from './ColorChoice'
import type { PanelProps } from './panelProps'
import { useDraft } from './useDraft'

export function SurfacePanel({ value, onChange, beginInteraction }: PanelProps<'surface'>) {
  const { draft, update } = useDraft<SurfaceComponent>(value, onChange, beginInteraction)

  return (
    <div style={panelStyle}>
      <ColorChoice
        label="Background"
        value={draft.background}
        onChange={background => update({ ...draft, background })}
      />
      <label style={fieldStyle}>
        <span style={labelStyle}>Border width (px)</span>
        <input
          type="number"
          min={0}
          step={1}
          style={inputStyle}
          value={draft.borderWidth}
          onChange={e => update({ ...draft, borderWidth: e.target.valueAsNumber || 0 })}
        />
      </label>
      {draft.borderWidth > 0 && (
        <ColorChoice
          label="Border colour"
          value={draft.borderColor}
          onChange={borderColor => update({ ...draft, borderColor })}
        />
      )}
      <label style={fieldStyle}>
        <span style={labelStyle}>Corner radius (px)</span>
        <input
          type="number"
          min={0}
          step={1}
          style={inputStyle}
          value={draft.radius}
          onChange={e => update({ ...draft, radius: e.target.valueAsNumber || 0 })}
        />
      </label>
    </div>
  )
}

const panelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }
const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
const inputStyle: CSSProperties = {
  alignSelf: 'flex-start',
  width: '6rem',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
}
