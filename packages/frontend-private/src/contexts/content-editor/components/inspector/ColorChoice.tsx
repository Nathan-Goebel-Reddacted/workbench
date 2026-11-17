import type { CSSProperties } from 'react'
import { Button, ColorField, isHexColor, useTheme } from '@atelier/shared-ui'
import type { ColorValue } from '@content'

const THEME_PREFIX = '--color-'

type Props = {
  label: string
  value: ColorValue | null
  onChange: (value: ColorValue | null) => void
}

export function ColorChoice({ label, value, onChange }: Props) {
  const { currentColors } = useTheme()
  const variables = Object.keys(currentColors).filter(name => name.startsWith(THEME_PREFIX))
  const resolved = !value ? '' : 'hex' in value ? value.hex : (currentColors[value.theme] ?? '')

  return (
    <div style={fieldStyle}>
      <div style={headerStyle}>
        <span style={labelStyle}>{label}</span>
        {value && (
          <Button variant="ghost" onClick={() => onChange(null)}>
            None
          </Button>
        )}
      </div>
      <div style={swatchesStyle}>
        {variables.map(name => (
          <button
            key={name}
            type="button"
            title={name.slice(THEME_PREFIX.length)}
            aria-label={name.slice(THEME_PREFIX.length)}
            aria-pressed={value !== null && 'theme' in value && value.theme === name}
            onClick={() => onChange({ theme: name })}
            style={swatchStyle(name, value !== null && 'theme' in value && value.theme === name)}
          />
        ))}
      </div>
      <ColorField
        label="Custom"
        value={isHexColor(resolved) ? resolved : ''}
        onChange={hex => {
          if (isHexColor(hex)) onChange({ hex })
        }}
      />
    </div>
  )
}

function swatchStyle(variable: string, selected: boolean): CSSProperties {
  return {
    width: '1.5rem',
    height: '1.5rem',
    padding: 0,
    cursor: 'pointer',
    backgroundColor: `var(${variable})`,
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    outline: selected ? '2px solid var(--color-primary)' : 'none',
    outlineOffset: '1px',
  }
}

const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.4rem' }
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const swatchesStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
