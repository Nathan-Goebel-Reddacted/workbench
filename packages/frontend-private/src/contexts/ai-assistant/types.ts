export const AGENT_SCOPES = ['project', 'feature', 'ticket', 'idea', 'portfolio'] as const
export const AGENT_PERMISSIONS = ['read', 'write', 'read_write'] as const

export type AgentScope = (typeof AGENT_SCOPES)[number]
export type AgentPermission = (typeof AGENT_PERMISSIONS)[number]

export type PairingRequest = {
  id: string
  name: string
  requestedScopes: AgentScope[]
  requestedPermission: AgentPermission
  codePrefix: string
  status: 'pending' | 'approved' | 'claimed' | 'rejected'
  expiresAt: string
}

export type AgentTool = {
  id: string
  userId: string
  ownerName: string | null
  name: string
  permission: AgentPermission
  scopes: AgentScope[]
  createdAt: string
  revokedAt: string | null
}
