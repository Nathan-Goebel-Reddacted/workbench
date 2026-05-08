import type { CSSProperties } from 'react'
import { useState } from 'react'
import { ColorPicker } from '@-reddacted-/react-ui'
import { useTheme, useAuth, themes, Button } from '@atelier/shared-ui'

const VAR_LABELS: Array<{ key: string; label: string }> = [
  { key: '--color-bg', label: 'Fond' },
  { key: '--color-surface', label: 'Surface' },
  { key: '--color-border', label: 'Bordure' },
  { key: '--color-text-muted', label: 'Texte secondaire' },
  { key: '--color-text', label: 'Texte' },
  { key: '--color-primary', label: 'Primaire' },
  { key: '--color-primary-hover', label: 'Primaire (survol)' },
]

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
}

export function DesignLabPage() {
  const { customColors, saveCustomColors } = useTheme()
  const { user } = useAuth()
  const canEdit = user?.roles.includes('edit') ?? false

  const [draft, setDraft] = useState<Record<string, string>>(
    () => ({ ...themes['light'], ...customColors }),
  )

  const handleChange = (key: string, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const handleRandomAll = () =>
    setDraft(Object.fromEntries(VAR_LABELS.map(({ key }) => [key, randomHex()])))

  const handleSave = () => saveCustomColors(draft)

  const handleReset = () => {
    setDraft({ ...themes['light'] })
    saveCustomColors({})
  }

  const handleExport = async () => {
    const css = `:root {\n${VAR_LABELS.map(({ key }) => `  ${key}: ${draft[key]};`).join('\n')}\n}`
    await navigator.clipboard.writeText(css)
  }

  const handleImport = async () => {
    const text = await navigator.clipboard.readText()
    const parsed: Record<string, string> = {}
    for (const { key } of VAR_LABELS) {
      const match = new RegExp(`${key}\\s*:\\s*(#[0-9a-fA-F]{6})`).exec(text)
      if (match) parsed[key] = match[1]
    }
    if (Object.keys(parsed).length > 0) {
      setDraft((prev) => ({ ...prev, ...parsed }))
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Design Lab</h1>
          <p style={subtitleStyle}>Personnalisez librement les couleurs de l'application.</p>
        </div>
        <Button variant="secondary" onClick={handleRandomAll}>Aléatoire</Button>
      </div>

      <div style={layoutStyle}>
        <section style={panelStyle}>
          {VAR_LABELS.map(({ key, label }) => (
            <div key={key} style={varRowStyle}>
              <span style={varLabelStyle}>{label}</span>
              <div style={varControlsStyle}>
                <ColorPicker
                  value={draft[key] ?? '#000000'}
                  onChange={(value) => handleChange(key, value)}
                />
                <button
                  style={randomBtnStyle}
                  title="Aléatoire"
                  onClick={() => handleChange(key, randomHex())}
                >
                  ↺
                </button>
              </div>
            </div>
          ))}

          <div style={actionsStyle}>
            <Button variant="ghost" onClick={handleReset}>Réinitialiser</Button>
            <Button variant="ghost" onClick={handleImport} disabled={!canEdit} title={!canEdit ? 'Rôle edit requis' : undefined}>Importer</Button>
            <Button variant="ghost" onClick={handleExport}>Exporter</Button>
            <Button variant="primary" onClick={handleSave} disabled={!canEdit} title={!canEdit ? 'Rôle edit requis' : undefined}>Enregistrer</Button>
          </div>
        </section>

        <section style={panelStyle}>
          <p style={panelLabelStyle}>Aperçu</p>
          <div style={{ ...(draft as CSSProperties), ...previewWrapperStyle }}>
            <div style={previewNavStyle}>
              <span style={previewBrandStyle}>Atelier</span>
              <span style={previewNavLinkStyle}>Design Lab</span>
            </div>
            <div style={previewBodyStyle}>
              <p style={previewTextStyle}>Titre de la page</p>
              <p style={previewMutedStyle}>Description — texte secondaire</p>
              <div style={previewDividerStyle} />
              <div style={previewCardStyle}>
                <p style={previewTextStyle}>Carte de surface</p>
                <p style={previewMutedStyle}>Contenu de la carte</p>
              </div>
              <div style={previewBtnsStyle}>
                <Button variant="primary">Principal</Button>
                <Button variant="secondary">Secondaire</Button>
                <Button variant="ghost">Fantôme</Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem', maxWidth: '1100px', margin: '0 auto' }
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }
const titleStyle: CSSProperties = { fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }
const subtitleStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }
const layoutStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }

const panelStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const panelLabelStyle: CSSProperties = { fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.75rem' }

const varRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--color-border)',
}

const varLabelStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
}

const varControlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}

const randomBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  color: 'var(--color-text-muted)',
  padding: '4px 6px',
  borderRadius: '4px',
  lineHeight: 1,
}

const actionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }

const previewWrapperStyle: CSSProperties = { borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }
const previewNavStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', height: '44px', backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }
const previewBrandStyle: CSSProperties = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }
const previewNavLinkStyle: CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)' }
const previewBodyStyle: CSSProperties = { backgroundColor: 'var(--color-bg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }
const previewTextStyle: CSSProperties = { fontSize: '0.9375rem', color: 'var(--color-text)', margin: 0, fontWeight: 500 }
const previewMutedStyle: CSSProperties = { fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }
const previewDividerStyle: CSSProperties = { height: '1px', backgroundColor: 'var(--color-border)' }
const previewCardStyle: CSSProperties = { backgroundColor: 'var(--color-surface)', borderRadius: '6px', padding: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }
const previewBtnsStyle: CSSProperties = { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }
