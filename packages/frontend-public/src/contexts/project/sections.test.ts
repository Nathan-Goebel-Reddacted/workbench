import { describe, expect, it } from 'vitest'
import { groupByCategory } from './sections'
import type { ProjectSummary } from './types'

function project(id: string, category: ProjectSummary['category']): ProjectSummary {
  return { id, name: id, description: '', category, destination: { kind: 'page' } }
}

describe('regroupement des projets publiés', () => {
  it('montre les sections connues même sans projet dedans', () => {
    const sections = groupByCategory([])

    expect(sections.map(s => s.key)).toEqual(['personal', 'professional', 'academic'])
    expect(sections.every(s => s.projects.length === 0)).toBe(true)
  })

  it('range chaque projet dans la section de sa catégorie', () => {
    const sections = groupByCategory([project('a', 'personal'), project('b', 'academic'), project('c', 'personal')])

    expect(sections.find(s => s.key === 'personal')?.projects.map(p => p.id)).toEqual(['a', 'c'])
    expect(sections.find(s => s.key === 'academic')?.projects.map(p => p.id)).toEqual(['b'])
    expect(sections.find(s => s.key === 'professional')?.projects).toEqual([])
  })

  // Le serveur peut publier une catégorie que ce front ne connaît pas encore : le projet doit
  // rester visible plutôt que de disparaître de la page.
  it('ouvre une section pour les projets hors nomenclature', () => {
    const sections = groupByCategory([project('a', 'personal'), project('b', null)])

    expect(sections.map(s => s.key)).toEqual(['personal', 'professional', 'academic', 'uncategorized'])
    expect(sections[sections.length - 1].projects.map(p => p.id)).toEqual(['b'])
  })

  it("n'ouvre pas cette section quand tous les projets sont classés", () => {
    const sections = groupByCategory([project('a', 'personal')])

    expect(sections.map(s => s.key)).not.toContain('uncategorized')
  })
})
