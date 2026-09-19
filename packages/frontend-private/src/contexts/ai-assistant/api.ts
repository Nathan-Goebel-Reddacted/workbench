import { getJson, send, sendJson } from '../../shared/api/http'
import type { Decision } from '../../shared/domain/decision'
import type { AgentPermission, AgentScope, AgentTool, PairingRequest } from './types'

function agentToolPath(id: string): string {
  return `/agent-tools/${id}`
}

export async function listPendingPairingRequests(): Promise<PairingRequest[]> {
  const { requests } = await getJson<{ requests: PairingRequest[] }>('/agent-pairing-requests?status=pending')
  return requests
}

export function decidePairingRequest(id: string, decision: Decision): Promise<void> {
  return send(`/agent-pairing-requests/${id}/${decision}`, { method: 'POST' })
}

export function listAgentTools(): Promise<AgentTool[]> {
  return getJson<AgentTool[]>('/agent-tools')
}

export function revokeAgentTool(id: string): Promise<void> {
  return send(`${agentToolPath(id)}/revoke`, { method: 'POST' })
}

export function restoreAgentTool(id: string): Promise<void> {
  return send(`${agentToolPath(id)}/restore`, { method: 'POST' })
}

export function changeAgentToolPermission(id: string, permission: AgentPermission): Promise<void> {
  return send(`${agentToolPath(id)}/permission`, { method: 'PATCH', body: { permission } })
}

export function grantAgentToolScope(id: string, scope: AgentScope): Promise<void> {
  return send(`${agentToolPath(id)}/scopes`, { method: 'POST', body: { scope } })
}

export function withdrawAgentToolScope(id: string, scope: AgentScope): Promise<void> {
  return send(`${agentToolPath(id)}/scopes`, { method: 'DELETE', body: { scope } })
}

export async function rotateAgentToolToken(id: string): Promise<string> {
  const { token } = await sendJson<{ token: string }>(`${agentToolPath(id)}/rotate-token`, { method: 'POST' })
  return token
}
