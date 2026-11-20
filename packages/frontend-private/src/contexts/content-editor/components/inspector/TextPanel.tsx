import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react'
import { TEXT_FONT_OPTIONS, type TextComponent, type TextFont } from '@content'
import { RichTextEditor } from '../RichTextEditor'
import { ColorChoice } from './ColorChoice'
import type { PanelProps } from './panelProps'

const SAVE_DELAY_MS = 800
const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 160

export function TextPanel({ value, onChange, beginInteraction, screen }: PanelProps<'text'>) {
  const [draft, setDraftState] = useState<TextComponent>(value)
  const latest = useRef(value)
  const save = useRef(onChange)
  save.current = onChange
  const pending = useRef<TextComponent | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const endInteraction = useRef<(() => void) | null>(null)

  const flush = () => {
    window.clearTimeout(timer.current)
    if (pending.current) save.current(pending.current)
    pending.current = null
  }

  const setDraft = (next: TextComponent) => {
    latest.current = next
    setDraftState(next)
  }

  const schedule = (next: TextComponent) => {
    setDraft(next)
    pending.current = next
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
  }

  useEffect(() => {
    latest.current = { ...latest.current, fontSize: value.fontSize }
    setDraftState(current => ({ ...current, fontSize: value.fontSize }))
  }, [value.fontSize])

  const commit = (patch: Partial<TextComponent>) => {
    const next = { ...latest.current, ...patch }
    setDraft(next)
    pending.current = next
    flush()
  }

  useEffect(
    () => () => {
      flush()
      endInteraction.current?.()
    },
    [],
  )

  const onFocus = () => {
    endInteraction.current ??= beginInteraction()
  }

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    flush()
    endInteraction.current?.()
    endInteraction.current = null
  }

  return (
    <div style={panelStyle} onFocus={onFocus} onBlur={onBlur}>
      <label style={fieldStyle}>
        <span style={labelStyle}>Font</span>
        <select style={selectStyle} value={draft.font} onChange={e => commit({ font: e.target.value as TextFont })}>
          {TEXT_FONT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <div style={rowStyle}>
        <NumberField
          label={`Size (${screen}, px)`}
          value={draft.fontSize[screen]}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={1}
          onCommit={size => commit({ fontSize: { ...latest.current.fontSize, [screen]: size } })}
        />
        <NumberField
          label="Letter spacing (em)"
          value={draft.letterSpacing}
          min={-0.05}
          max={0.5}
          step={0.01}
          onCommit={letterSpacing => commit({ letterSpacing })}
        />
      </div>
      <label style={checkStyle}>
        <input type="checkbox" checked={draft.uppercase} onChange={e => commit({ uppercase: e.target.checked })} />
        Capitals
      </label>
      <ColorChoice label="Text colour" value={draft.color} onChange={color => schedule({ ...latest.current, color })} />
      <RichTextEditor html={draft.html} onChange={html => schedule({ ...latest.current, html })} />
    </div>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onCommit: (value: number) => void
}

function NumberField({ label, value, min, max, step, onCommit }: NumberFieldProps) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  const apply = () => {
    const parsed = Number(text)
    if (text.trim() === '' || !Number.isFinite(parsed)) return setText(String(value))
    const bounded = Math.min(Math.max(step >= 1 ? Math.round(parsed) : parsed, min), max)
    setText(String(bounded))
    if (bounded !== value) onCommit(bounded)
  }

  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type="number"
        style={selectStyle}
        value={text}
        min={min}
        max={max}
        step={step}
        onChange={e => setText(e.target.value)}
        onBlur={apply}
        onKeyDown={e => {
          if (e.key === 'Enter') apply()
        }}
      />
    </label>
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
const selectStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
}
const rowStyle: CSSProperties = { display: 'flex', gap: '0.75rem' }
const checkStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
}
