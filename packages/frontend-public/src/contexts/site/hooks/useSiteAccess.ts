import { useAsync } from '@atelier/shared-ui'
import { getSiteAccess } from '../api'

export function useSiteAccess() {
  const { data, status } = useAsync(signal => getSiteAccess(signal))
  return { access: data, status }
}
