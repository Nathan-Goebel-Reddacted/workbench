import type { BindingSource } from '../contexts/content-editor'
import { listFeaturesByOwner } from '../contexts/feature'
import { listProjects } from '../contexts/project'
import { listTicketsByFeature } from '../contexts/ticket'

export const bindingSource: BindingSource = {
  async listProjects(signal) {
    const projects = await listProjects(signal)
    return projects.map(({ id, name }) => ({ id, name }))
  },
  async listProjectFeatures(projectId, signal) {
    const features = await listFeaturesByOwner('project', projectId, signal)
    return features.map(({ id, name }) => ({ id, name }))
  },
  async listFeatureTickets(featureId, signal) {
    const tickets = await listTicketsByFeature(featureId, signal)
    return tickets.map(({ id, reference, title }) => ({ id, label: `${reference} — ${title}` }))
  },
}
