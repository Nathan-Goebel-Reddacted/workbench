import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button, ColorField, defaultPalette, parseColors, serializeColors, randomHex } from '@atelier/shared-ui'
import { EDIT_ROLE_REQUIRED, useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { useThemes } from '../hooks/useThemes'
import type { Theme, ThemeColors } from '../types'

const EDITABLE_VARS: Array<{ key: string; label: string }> = [
  { key: '--color-bg', label: 'Background' },
  { key: '--color-surface', label: 'Surface' },
  { key: '--color-border', label: 'Border' },
  { key: '--color-text-muted', label: 'Secondary text' },
  { key: '--color-text', label: 'Text' },
  { key: '--color-primary', label: 'Primary' },
  { key: '--color-primary-hover', label: 'Primary (hover)' },
]

const DEFAULT_STAYS_VISIBLE = 'The default theme stays visible'
const HIDDEN_CANNOT_BE_DEFAULT = 'A hidden theme cannot be the default'

const EDITABLE_KEYS = EDITABLE_VARS.map(({ key }) => key)

function pickEditable(colors: ThemeColors): ThemeColors {
  return Object.fromEntries(EDITABLE_KEYS.map(key => [key, colors[key] ?? defaultPalette[key]]))
}

export function ThemeEditorPage() {
  const canEdit = useCanEdit()

  const [draft, setDraft] = useState<ThemeColors>(() => pickEditable(defaultPalette))
  const [targetId, setTargetId] = useState<string | null>(null)

  const { themes, defaultId, error, create, overwrite, rename, toggleVisible, setDefault } = useThemes(current => {
    setDraft(pickEditable(current.colors))
    setTargetId(current.id)
  })

  const handleChange = (key: string, value: string) => setDraft(prev => ({ ...prev, [key]: value }))

  const handleRandomAll = () => setDraft(Object.fromEntries(EDITABLE_KEYS.map(key => [key, randomHex()])))

  const handleReset = () => {
    setDraft(pickEditable(defaultPalette))
    setTargetId(null)
  }

  const handleExport = async () => {
    await navigator.clipboard.writeText(serializeColors(draft))
  }

  const pasteInto = async (id: string | null) => {
    const parsed = parseColors(await navigator.clipboard.readText())
    if (Object.keys(parsed).length === 0) return
    setDraft(prev => pickEditable({ ...prev, ...parsed }))
    if (id) setTargetId(id)
  }

  const handleLoad = (theme: Theme) => {
    setDraft(pickEditable(theme.colors))
    setTargetId(theme.id)
  }

  const handleCreate = async () => {
    const id = await create(draft)
    if (id) setTargetId(id)
  }

  const handleOverwrite = async (theme: Theme) => {
    await overwrite(theme, draft)
    setTargetId(theme.id)
  }

  const editGuard = canEdit ? undefined : EDIT_ROLE_REQUIRED

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Theme Editor</h1>
          <p style={subtitleStyle}>Compose a palette, then save it as a theme.</p>
        </div>
        <Button variant="secondary" onClick={handleRandomAll}>
          Random
        </Button>
      </div>

      <div style={layoutStyle}>
        <section style={panelStyle}>
          {EDITABLE_VARS.map(({ key, label }) => (
            <ColorField
              key={key}
              label={label}
              value={draft[key] ?? defaultPalette[key]}
              onChange={value => handleChange(key, value)}
              randomLabel="Random colour"
            />
          ))}

          <div style={actionsStyle}>
            <Button variant="ghost" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="ghost" onClick={() => void pasteInto(null)}>
              Import
            </Button>
            <Button variant="ghost" onClick={() => void handleExport()}>
              Export
            </Button>
            <Button variant="primary" onClick={() => void handleCreate()} disabled={!canEdit} title={editGuard}>
              New theme
            </Button>
          </div>
        </section>

        <section style={panelStyle}>
          <p style={panelLabelStyle}>Preview</p>
          <div style={{ ...({ ...defaultPalette, ...draft } as CSSProperties), ...previewWrapperStyle }}>
            <div style={previewNavStyle}>
              <span style={previewBrandStyle}>Atelier</span>
              <span style={previewNavLinkStyle}>Theme Editor</span>
            </div>
            <div style={previewBodyStyle}>
              <p style={previewTextStyle}>Page title</p>
              <p style={previewMutedStyle}>Description — secondary text</p>
              <div style={previewDividerStyle} />
              <div style={previewCardStyle}>
                <p style={previewTextStyle}>Surface card</p>
                <p style={previewMutedStyle}>Card content</p>
              </div>
              <div style={previewBtnsStyle}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section style={{ ...panelStyle, marginTop: '1.5rem' }}>
        <p style={panelLabelStyle}>Saved themes</p>
        {error && <p style={errorStyle}>{error}</p>}

        {themes.length === 0 && <p style={emptyStyle}>No saved theme. “New theme” saves the current palette.</p>}

        <div style={listStyle}>
          {themes.map(theme => (
            <div key={theme.id} style={{ ...({ ...defaultPalette, ...theme.colors } as CSSProperties), ...rowStyle }}>
              <div style={rowMainStyle}>
                <input
                  defaultValue={theme.name}
                  key={theme.name}
                  onBlur={async event => {
                    const input = event.target
                    if (!(await rename(theme, input.value))) input.value = theme.name
                  }}
                  disabled={!canEdit}
                  style={nameInputStyle}
                  aria-label="Theme name"
                />
                <div style={swatchesStyle}>
                  {EDITABLE_VARS.map(({ key, label }) => (
                    <span key={key} style={{ ...swatchStyle, backgroundColor: `var(${key})` }} title={label} />
                  ))}
                </div>
                <p style={rowSampleStyle}>
                  Main text — <span style={rowSampleMutedStyle}>secondary</span>
                </p>
              </div>

              <div style={rowActionsStyle}>
                <label
                  style={toggleStyle}
                  title={editGuard ?? (defaultId === theme.id ? DEFAULT_STAYS_VISIBLE : undefined)}
                >
                  <input
                    type="checkbox"
                    checked={theme.visible}
                    onChange={() => void toggleVisible(theme)}
                    disabled={!canEdit || defaultId === theme.id}
                  />
                  Visible
                </label>

                <label style={toggleStyle} title={editGuard ?? (theme.visible ? undefined : HIDDEN_CANNOT_BE_DEFAULT)}>
                  <input
                    type="radio"
                    name="default-theme"
                    checked={defaultId === theme.id}
                    onChange={() => void setDefault(theme)}
                    disabled={!canEdit || !theme.visible}
                  />
                  Default
                </label>

                <Button variant={targetId === theme.id ? 'secondary' : 'ghost'} onClick={() => handleLoad(theme)}>
                  Load
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void navigator.clipboard.writeText(serializeColors(theme.colors))}
                >
                  Copy
                </Button>
                <Button variant="ghost" onClick={() => void pasteInto(theme.id)} disabled={!canEdit} title={editGuard}>
                  Paste
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handleOverwrite(theme)}
                  disabled={!canEdit}
                  title={editGuard}
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem', maxWidth: '1100px', margin: '0 auto' }
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: '1.75rem',
}
const titleStyle: CSSProperties = { fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }
const subtitleStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }
const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1.5rem',
  alignItems: 'start',
}

const panelStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const panelLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 0.75rem',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid var(--color-border)',
}

const errorStyle: CSSProperties = { margin: 0, fontSize: '0.875rem', color: 'var(--color-primary)' }
const emptyStyle: CSSProperties = { margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }

const listStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '1rem',
  padding: '0.875rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
}

const rowMainStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }

const nameInputStyle: CSSProperties = {
  padding: '0.375rem 0.5rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  minWidth: '10rem',
}

const swatchesStyle: CSSProperties = { display: 'flex', gap: '0.25rem' }

const swatchStyle: CSSProperties = {
  width: '18px',
  height: '18px',
  borderRadius: '4px',
  border: '1px solid var(--color-border)',
}

const rowSampleStyle: CSSProperties = { margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)' }
const rowSampleMutedStyle: CSSProperties = { color: 'var(--color-text-muted)' }

const rowActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
}

const toggleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  fontSize: '0.8125rem',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
}

const previewWrapperStyle: CSSProperties = {
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid var(--color-border)',
}
const previewNavStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1rem',
  height: '44px',
  backgroundColor: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
}
const previewBrandStyle: CSSProperties = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }
const previewNavLinkStyle: CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)' }
const previewBodyStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.875rem',
}
const previewTextStyle: CSSProperties = {
  fontSize: '0.9375rem',
  color: 'var(--color-text)',
  margin: 0,
  fontWeight: 500,
}
const previewMutedStyle: CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }
const previewDividerStyle: CSSProperties = { height: '1px', backgroundColor: 'var(--color-border)' }
const previewCardStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: '6px',
  padding: '0.75rem',
  border: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}
const previewBtnsStyle: CSSProperties = { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }
