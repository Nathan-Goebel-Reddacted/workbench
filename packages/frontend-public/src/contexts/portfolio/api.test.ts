import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPortfolio } from './api'

const getJson = vi.hoisted(() => vi.fn())

vi.mock('../../shared/api/http', () => ({ getJson }))

describe('traduction du portfolio', () => {
  beforeEach(() => getJson.mockReset())

  it('traduit le portfolio existant', async () => {
    getJson.mockResolvedValue({ id: 'p1' })

    await expect(fetchPortfolio()).resolves.toEqual({ id: 'p1' })
  })

  // Aucun portfolio créé : la route répond 200 sans corps. La page d'accueil sera nue, ce
  // n'est pas une panne — donc null, pas une exception.
  it("rend null tant qu'aucun portfolio n'a été créé", async () => {
    getJson.mockResolvedValue(null)

    await expect(fetchPortfolio()).resolves.toBeNull()
  })
})
