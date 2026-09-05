import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
  useTheme,
  useAuth,
  Button,
  ColorField,
  defaultPalette,
  parseColors,
  serializeColors,
  randomHex,
  type ThemeColors,
  type ThemeDefinition,
} from '@atelier/shared-ui'

// Un thème ne pilote que ces sept couleurs. Les autres variables du vocabulaire
// (mindmap, erreur, primaire douce) restent celles de la palette de base.
const EDITABLE_VARS: Array<{ key: string; label: string }> = [
  { key: '--color-bg', label: 'Fond' },
  { key: '--color-surface', label: 'Surface' },
  { key: '--color-border', label: 'Bordure' },
  { key: '--color-text-muted', label: 'Texte secondaire' },
  { key: '--color-text', label: 'Texte' },
  { key: '--color-primary', label: 'Primaire' },
  { key: '--color-primary-hover', label: 'Primaire (survol)' },
]

const EDITABLE_KEYS = EDITABLE_VARS.map(({ key }) => key)

function pickEditable(colors: ThemeColors): ThemeColors {
  return Object.fromEntries(EDITABLE_KEYS.map(key => [key, colors[key] ?? defaultPalette[key]]))
}

const NEW_THEME_NAME = 'Nouveau thème'

export function ThemeEditorPage() {
  const { store, reload } = useTheme()
  const { user } = useAuth()
  const canEdit = user?.roles.includes('edit') ?? false

  const [themes, setThemes] = useState<ThemeDefinition[]>([])
  const [defaultId, setDefaultId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ThemeColors>(() => pickEditable(defaultPalette))
  const [targetId, setTargetId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const catalog = await store.loadAll()
    setThemes(catalog.themes)
    setDefaultId(catalog.defaultId)
    await reload()
  }, [store, reload])

  useEffect(() => {
    void refresh()
  }, [refresh])

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

  const handleLoad = (theme: ThemeDefinition) => {
    setDraft(pickEditable(theme.colors))
    setTargetId(theme.id)
  }

  const handleCreate = async () => {
    const created = await store.create({ name: NEW_THEME_NAME, visible: true, colors: draft })
    setTargetId(created.id)
    await refresh()
  }

  const handleOverwrite = async (theme: ThemeDefinition) => {
    await store.update(theme.id, { name: theme.name, visible: theme.visible, colors: draft })
    setTargetId(theme.id)
    await refresh()
  }

  const handleRename = async (theme: ThemeDefinition, name: string) => {
    const trimmed = name.trim()
    if (trimmed === '' || trimmed === theme.name) return
    await store.update(theme.id, { name: trimmed, visible: theme.visible, colors: theme.colors })
    await refresh()
  }

  const handleToggleVisible = async (theme: ThemeDefinition) => {
    await store.update(theme.id, { name: theme.name, visible: !theme.visible, colors: theme.colors })
    await refresh()
  }

  const handleSetDefault = async (theme: ThemeDefinition) => {
    await store.setDefault(theme.id)
    await refresh()
  }

  const editGuard = canEdit ? undefined : 'Rôle edit requis'

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Theme Editor</h1>
          <p style={subtitleStyle}>Composez une palette, puis enregistrez-la dans un thème.</p>
        </div>
        <Button variant="secondary" onClick={handleRandomAll}>
          Aléatoire
        </Button>
      </div>

      <div style={layoutStyle}>
        <section style={panelStyle}>
          {EDITABLE_VARS.map(({ key, label }) => (
            <ColorField
              key={key}
              label={label}
              value={draft[key] ?? '#000000'}
              onChange={value => handleChange(key, value)}
              randomLabel="Couleur aléatoire"
            />
          ))}

          <div style={actionsStyle}>
            <Button variant="ghost" onClick={handleReset}>
              Réinitialiser
            </Button>
            <Button variant="ghost" onClick={() => void pasteInto(null)}>
              Importer
            </Button>
            <Button variant="ghost" onClick={() => void handleExport()}>
              Exporter
            </Button>
            <Button variant="primary" onClick={() => void handleCreate()} disabled={!canEdit} title={editGuard}>
              Nouveau thème
            </Button>
          </div>
        </section>

        <section style={panelStyle}>
          <p style={panelLabelStyle}>Aperçu</p>
          <div style={{ ...({ ...defaultPalette, ...draft } as CSSProperties), ...previewWrapperStyle }}>
            <div style={previewNavStyle}>
              <span style={previewBrandStyle}>Atelier</span>
              <span style={previewNavLinkStyle}>Theme Editor</span>
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

      <section style={{ ...panelStyle, marginTop: '1.5rem' }}>
        <p style={panelLabelStyle}>Thèmes enregistrés</p>

        {themes.length === 0 && (
          <p style={emptyStyle}>Aucun thème enregistré. « Nouveau thème » enregistre la palette courante.</p>
        )}

        <div style={listStyle}>
          {themes.map(theme => (
            <div key={theme.id} style={{ ...({ ...defaultPalette, ...theme.colors } as CSSProperties), ...rowStyle }}>
              <div style={rowMainStyle}>
                <input
                  defaultValue={theme.name}
                  key={theme.name}
                  onBlur={event => void handleRename(theme, event.target.value)}
                  disabled={!canEdit}
                  style={nameInputStyle}
                  aria-label="Nom du thème"
                />
                <div style={swatchesStyle}>
                  {EDITABLE_VARS.map(({ key, label }) => (
                    <span key={key} style={{ ...swatchStyle, backgroundColor: `var(${key})` }} title={label} />
                  ))}
                </div>
                <p style={rowSampleStyle}>
                  Texte principal — <span style={rowSampleMutedStyle}>secondaire</span>
                </p>
              </div>

              <div style={rowActionsStyle}>
                <label style={toggleStyle}>
                  <input
                    type="checkbox"
                    checked={theme.visible}
                    onChange={() => void handleToggleVisible(theme)}
                    disabled={!canEdit}
                  />
                  Visible
                </label>

                <label style={toggleStyle}>
                  <input
                    type="radio"
                    name="default-theme"
                    checked={defaultId === theme.id}
                    onChange={() => void handleSetDefault(theme)}
                    disabled={!canEdit}
                  />
                  Par défaut
                </label>

                <Button variant={targetId === theme.id ? 'secondary' : 'ghost'} onClick={() => handleLoad(theme)}>
                  Charger
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => void navigator.clipboard.writeText(serializeColors(theme.colors))}
                >
                  Copier
                </Button>
                <Button variant="ghost" onClick={() => void pasteInto(theme.id)} disabled={!canEdit} title={editGuard}>
                  Coller
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handleOverwrite(theme)}
                  disabled={!canEdit}
                  title={editGuard}
                >
                  Enregistrer
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

const emptyStyle: CSSProperties = { margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }

const listStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }

// La ligne porte les variables de son propre thème : tout ce qu'elle contient s'affiche
// dans ces couleurs, ce qui vaut test de lisibilité.
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
