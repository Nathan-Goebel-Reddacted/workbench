import { getJson } from '../../shared/api/http'
import type { Portfolio } from './types'

type PortfolioDto = { id: string }

// Tant qu'aucun portfolio n'a été créé, la route rend 200 sans corps : la page d'accueil est
// simplement nue, ce n'est pas une panne.
export async function fetchPortfolio(signal?: AbortSignal): Promise<Portfolio | null> {
  const dto = await getJson<PortfolioDto>('/portfolio', signal)
  return dto ? { id: dto.id } : null
}
