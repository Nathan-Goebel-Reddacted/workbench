import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listPublishedCvs } from './api'

const getJson = vi.hoisted(() => vi.fn())

vi.mock('../../shared/api/http', () => ({ getJson }))
vi.mock('../../shared/config', () => ({ uploadUrl: (url: string) => `https://api.test${url}` }))

describe('traduction des CV publiés', () => {
  beforeEach(() => getJson.mockReset())

  // Les fichiers sont persistés en chemin relatif : l'origine n'est ajoutée qu'à la frontière,
  // pour que la page n'ait jamais à connaître l'API.
  it("résout l'adresse du fichier", async () => {
    getJson.mockResolvedValue([{ id: '1', name: 'CV 2026', fileUrl: '/uploads/cv.pdf' }])

    await expect(listPublishedCvs()).resolves.toEqual([
      { id: '1', name: 'CV 2026', fileUrl: 'https://api.test/uploads/cv.pdf' },
    ])
  })

  it('préserve l’ordre choisi côté administration', async () => {
    getJson.mockResolvedValue([
      { id: '2', name: 'Second', fileUrl: '/uploads/b.pdf' },
      { id: '1', name: 'Premier', fileUrl: '/uploads/a.pdf' },
    ])

    await expect(listPublishedCvs()).resolves.toMatchObject([{ id: '2' }, { id: '1' }])
  })

  it('rend une liste vide quand le serveur ne renvoie pas de corps', async () => {
    getJson.mockResolvedValue(null)

    await expect(listPublishedCvs()).resolves.toEqual([])
  })
})
