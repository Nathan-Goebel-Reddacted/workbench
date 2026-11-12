import { useAsync } from '@atelier/shared-ui'
import { fetchPortfolio } from '../api'

export function usePortfolio() {
  const { data, status, retry } = useAsync(signal => fetchPortfolio(signal))
  return { portfolio: data, status, retry }
}
