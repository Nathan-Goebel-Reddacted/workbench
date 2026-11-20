import type { CSSProperties } from 'react'
import type { CodeComponent } from '@content'
import type { PanelProps } from './panelProps'
import { fieldStyle, inputStyle, labelStyle, panelStyle } from './panelStyles'
import { useDraft } from './useDraft'

export function CodePanel({ value, onChange, beginInteraction }: PanelProps<'code'>) {
  const { draft, update } = useDraft<CodeComponent>(value, onChange, beginInteraction)

  return (
    <div style={panelStyle}>
      <label style={fieldStyle}>
        <span style={labelStyle}>Language</span>
        <input
          style={inputStyle}
          placeholder="ts, php, bash…"
          value={draft.language}
          onChange={e => update({ ...draft, language: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        <span style={labelStyle}>Code</span>
        <textarea
          style={codeStyle}
          spellCheck={false}
          value={draft.code}
          onChange={e => update({ ...draft, code: e.target.value })}
        />
      </label>
      <label style={checkStyle}>
        <input type="checkbox" checked={draft.wrap} onChange={e => update({ ...draft, wrap: e.target.checked })} />
        Wrap long lines
      </label>
    </div>
  )
}

const codeStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '12rem',
  resize: 'vertical',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.8125rem',
}
const checkStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
}
