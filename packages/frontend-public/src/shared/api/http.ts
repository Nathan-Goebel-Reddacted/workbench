import { fetchJson } from '@atelier/shared-ui'
import { API_URL } from '../config'

// Le site public ne lit que des ressources publiées : un corps vide vaut « rien à montrer »
// et rend null, seul un statut d'erreur remonte en exception.
export function getJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  return fetchJson<T>(`${API_URL}${path}`, signal)
}
