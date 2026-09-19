import { createContext, useContext, type ReactNode } from 'react'
import type { BindableFeature, BindableProject, BindableTicket } from './types'

export type BindingSource = {
  listProjects(signal: AbortSignal): Promise<BindableProject[]>
  listProjectFeatures(projectId: string, signal: AbortSignal): Promise<BindableFeature[]>
  listFeatureTickets(featureId: string, signal: AbortSignal): Promise<BindableTicket[]>
}

const BindingSourceContext = createContext<BindingSource | null>(null)

export function BindingSourceProvider({ source, children }: { source: BindingSource; children: ReactNode }) {
  return <BindingSourceContext.Provider value={source}>{children}</BindingSourceContext.Provider>
}

export function useBindingSource(): BindingSource {
  const source = useContext(BindingSourceContext)
  if (!source) throw new Error('BindingSourceProvider is missing')
  return source
}
