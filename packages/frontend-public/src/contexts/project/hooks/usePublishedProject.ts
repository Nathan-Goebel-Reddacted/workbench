import { useAsync } from '@atelier/shared-ui'
import { fetchPublishedProject } from '../api'

export function usePublishedProject(id: string | undefined) {
  const { data, status, retry } = useAsync(
    signal => (id ? fetchPublishedProject(id, signal) : Promise.resolve(null)),
    [id],
  )
  return { project: data, status, retry }
}
