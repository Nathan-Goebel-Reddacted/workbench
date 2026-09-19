import { getJson, send, sendJson } from '../../shared/api/http'
import type { Theme, ThemeCatalog, ThemeColors, ThemeDraft } from './types'

export function listAllThemes(): Promise<ThemeCatalog> {
  return getJson<ThemeCatalog>('/themes/all')
}

export function createTheme(colors: ThemeColors): Promise<Theme> {
  return sendJson<Theme>('/themes', { method: 'POST', body: { colors } })
}

export function updateTheme(id: string, draft: ThemeDraft): Promise<void> {
  return send(`/themes/${id}`, { method: 'PUT', body: draft })
}

export function setDefaultTheme(id: string): Promise<void> {
  return send('/themes/default', { method: 'PUT', body: { id } })
}
