import { CATEGORIES } from './types'
import type { ProjectSummary } from './types'
import { CATEGORY_LABELS, UNCATEGORIZED_LABEL } from './labels'

export type Section = { key: string; label: string; projects: ProjectSummary[] }

// Les sections connues sont toujours montrées, vides ou non ; celle des projets hors
// nomenclature n’apparaît que si le serveur en renvoie, pour qu'aucun projet publié ne
// disparaisse de la page.
export function groupByCategory(projects: ProjectSummary[]): Section[] {
  const sections: Section[] = CATEGORIES.map(category => ({
    key: category,
    label: CATEGORY_LABELS[category],
    projects: projects.filter(p => p.category === category),
  }))

  const uncategorized = projects.filter(p => p.category === null)
  if (uncategorized.length > 0) {
    sections.push({ key: 'uncategorized', label: UNCATEGORIZED_LABEL, projects: uncategorized })
  }

  return sections
}
