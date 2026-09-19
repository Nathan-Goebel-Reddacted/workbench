import { useAsync } from '@atelier/shared-ui'
import { useBindingSource } from '../bindingSource'
import type { BindableFeature, BindableProject, BindableTicket } from '../types'

export function useBindableProjects() {
  const source = useBindingSource()
  const { data, status } = useAsync<BindableProject[]>(signal => source.listProjects(signal), [source])
  return { projects: data ?? [], loading: status === 'loading' }
}

export function useBindableFeatures(projectId: string | null) {
  const source = useBindingSource()
  const { data } = useAsync<BindableFeature[]>(
    async signal => (projectId ? source.listProjectFeatures(projectId, signal) : []),
    [source, projectId],
  )
  return data ?? []
}

export function useBindableTickets(featureId: string | null) {
  const source = useBindingSource()
  const { data } = useAsync<BindableTicket[]>(
    async signal => (featureId ? source.listFeatureTickets(featureId, signal) : []),
    [source, featureId],
  )
  return data ?? []
}
