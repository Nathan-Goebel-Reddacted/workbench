import { getJson, send, sendJson } from '../../shared/api/http'
import type { Theme, ThemeCatalog, ThemeColors } from './types'

function themePath(id: string): string {
  return `/themes/${id}`
}

export function listAllThemes(): Promise<ThemeCatalog> {
  return getJson<ThemeCatalog>('/themes/all')
}

export function createTheme(colors: ThemeColors): Promise<Theme> {
  return sendJson<Theme>('/themes', { method: 'POST', body: { colors } })
}

export function renameTheme(id: string, name: string): Promise<void> {
  return send(`${themePath(id)}/name`, { method: 'PATCH', body: { name } })
}

export function recolorTheme(id: string, colors: ThemeColors): Promise<void> {
  return send(`${themePath(id)}/colors`, { method: 'PATCH', body: { colors } })
}

export function setThemeVisibility(id: string, visible: boolean): Promise<void> {
  return send(`${themePath(id)}/visibility`, { method: 'PATCH', body: { visible } })
}

export function setDefaultTheme(id: string): Promise<void> {
  return send('/themes/default', { method: 'PUT', body: { id } })
}
