import { API_URL } from '../config'

// Le site public ne lit que des ressources publiées : un corps vide vaut « rien à montrer »
// et rend null, seul un statut d'erreur remonte en exception. Le cookie suit : une session
// privée voit le site même fermé, en développement comme en production.
export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  const url = `${API_URL}${path}`
  const res = await fetch(url, { signal, credentials: 'include' })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  const body = await res.text()
  return body.trim() === '' ? null : (JSON.parse(body) as T)
}
