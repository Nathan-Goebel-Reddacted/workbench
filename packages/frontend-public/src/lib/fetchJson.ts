// Lecture d'une réponse JSON pour les pages publiques.
// Un statut non 2xx lève : l'appelant distingue ainsi la panne du « pas de contenu ».
// Un corps vide rend null — les routes de lecture répondent 200 sans corps quand
// l'agrégat n'existe pas encore (portfolio jamais créé, layout jamais composé).
export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)

  const body = await res.text()
  if (body.trim() === '') return null
  return JSON.parse(body) as T
}
