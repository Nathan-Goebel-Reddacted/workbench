import { getJson } from '../../shared/api/http'
import type { Portfolio } from './types'

export function getPortfolio(signal?: AbortSignal): Promise<Portfolio | null> {
  return getJson<Portfolio | null>('/portfolio', signal)
}
