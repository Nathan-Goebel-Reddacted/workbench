import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPublishedProject, listPublishedProjects } from './api'

const getJson = vi.hoisted(() => vi.fn())

vi.mock('../../shared/api/http', () => ({ getJson }))

describe('traduction des projets publiés', () => {
  beforeEach(() => getJson.mockReset())

  it('garde la catégorie quand elle appartient à la nomenclature', async () => {
    getJson.mockResolvedValue([{ id: '1', name: 'Atelier', description: 'Un projet', category: 'academic' }])

    await expect(listPublishedProjects()).resolves.toEqual([
      { id: '1', name: 'Atelier', description: 'Un projet', category: 'academic' },
    ])
  })

  // Une catégorie ajoutée côté serveur ne doit ni traverser telle quelle, ni faire disparaître
  // le projet : elle vaut « hors nomenclature ».
  it('rabat une catégorie inconnue sur « hors nomenclature »', async () => {
    getJson.mockResolvedValue([{ id: '1', name: 'Atelier', description: '', category: 'associatif' }])

    await expect(listPublishedProjects()).resolves.toEqual([
      { id: '1', name: 'Atelier', description: '', category: null },
    ])
  })

  // Corps vide : la route a répondu, il n'y a simplement rien de publié.
  it('rend une liste vide quand le serveur ne renvoie pas de corps', async () => {
    getJson.mockResolvedValue(null)

    await expect(listPublishedProjects()).resolves.toEqual([])
  })

  it('rend null pour un projet masqué ou inexistant', async () => {
    getJson.mockResolvedValue(null)

    await expect(fetchPublishedProject('inconnu')).resolves.toBeNull()
  })

  it('traduit un projet visible', async () => {
    getJson.mockResolvedValue({ id: '1', name: 'Atelier' })

    await expect(fetchPublishedProject('1')).resolves.toEqual({ id: '1', name: 'Atelier' })
  })
})
