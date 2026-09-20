// La catégorie appartient au projet : c'est lui, et lui seul, qui la porte — côté serveur
// comme ici.
export const CATEGORIES = ['personal', 'professional', 'academic'] as const

export type Category = (typeof CATEGORIES)[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

// Le serveur n'expose au public que les projets visibles : le drapeau n'a plus de sens ici.
// La catégorie, elle, peut sortir de la nomenclature connue du front si le serveur en ajoute
// une : elle vaut alors « hors nomenclature », jamais « absente ».
export type ProjectDestination = { kind: 'page' } | { kind: 'external'; url: string } | { kind: 'none' }

export function isDestination(value: unknown): value is ProjectDestination {
  if (typeof value !== 'object' || value === null) return false
  const kind = (value as { kind?: unknown }).kind
  if (kind === 'page' || kind === 'none') return true
  return kind === 'external' && typeof (value as { url?: unknown }).url === 'string'
}

export type ProjectSummary = {
  id: string
  name: string
  description: string
  category: Category | null
  destination: ProjectDestination
}

export type PublishedProject = {
  id: string
  name: string
  destination: ProjectDestination
}
