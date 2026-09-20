import { useAsync } from '@atelier/shared-ui'
import { listPublishedCvs } from '../api'

export function usePublishedCvs() {
  const { data, status, retry } = useAsync(signal => listPublishedCvs(signal))
  return { cvs: data ?? [], status, retry }
}
