import { useAsync } from '@atelier/shared-ui'
import { listPublishedProjects } from '../api'

export function usePublishedProjects() {
  const { data, status, retry } = useAsync(signal => listPublishedProjects(signal))
  return { projects: data ?? [], status, retry }
}
