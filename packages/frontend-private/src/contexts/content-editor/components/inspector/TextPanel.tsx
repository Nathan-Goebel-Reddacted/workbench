import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react'
import { TEXT_SCALE_OPTIONS, type TextComponent, type TextScale } from '@content'
import { RichTextEditor } from '../RichTextEditor'
import type { PanelProps } from './panelProps'

const SAVE_DELAY_MS = 800

export function TextPanel({ value, onChange, beginInteraction }: PanelProps<'text'>) {
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
        <span style={labelStyle}>Text size</span>
        <select
          style={selectStyle}
          value={draft.scale}
          onChange={e => {
            const next = { ...latest.current, scale: e.target.value as TextScale }
            setDraft(next)
            pending.current = next
            flush()
          }}
        >
          {TEXT_SCALE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <RichTextEditor html={draft.html} onChange={html => schedule({ ...latest.current, html })} />
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
const selectStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
}
