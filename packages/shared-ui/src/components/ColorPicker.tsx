import type { CSSProperties } from 'react'
import { Button } from './Button'

type ColorPickerProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const handleTextChange = (raw: string) => {
    const cleaned = raw.startsWith('#') ? raw : `#${raw}`
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) onChange(cleaned)
  }

  return (
    <div style={rowStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={controlsStyle}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={colorSwatchStyle}
          title={`Choisir ${label}`}
        />
        <input
          type="text"
          defaultValue={value}
          key={value}
          onChange={(e) => handleTextChange(e.target.value)}
          maxLength={7}
          style={hexInputStyle}
          placeholder="#000000"
        />
        <Button variant="ghost" onClick={() => onChange(randomHex())} style={randomBtnStyle} title="Couleur aléatoire">
          ↺
        </Button>
      </div>
    </div>
  )
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--color-border)',
}

const labelStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  minWidth: '140px',
}

const controlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const colorSwatchStyle: CSSProperties = {
  width: '36px',
  height: '36px',
  padding: '2px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  cursor: 'pointer',
  backgroundColor: 'transparent',
}

const hexInputStyle: CSSProperties = {
  width: '90px',
  padding: '0.375rem 0.5rem',
  fontSize: '0.8125rem',
  fontFamily: 'monospace',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
}

const randomBtnStyle: CSSProperties = {
  fontSize: '1rem',
  padding: '0.375rem 0.5rem',
}
