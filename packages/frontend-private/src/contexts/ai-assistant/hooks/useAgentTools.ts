import { useCallback, useEffect, useState } from 'react'
import { errorDetailOr } from '../../../shared/api/errors'
import {
  changeAgentToolPermission,
  grantAgentToolScope,
  listAgentTools,
  restoreAgentTool,
  revokeAgentTool,
  withdrawAgentToolScope,
} from '../api'
import type { AgentPermission, AgentScope, AgentTool } from '../types'

export function useAgentTools(reloadKey: number) {
  const [agentTools, setAgentTools] = useState<AgentTool[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      setAgentTools(await listAgentTools())
    } catch {
      setError('Could not load the AI agents.')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload, reloadKey])

  const toggleRevoke = async (tool: AgentTool): Promise<void> => {
    try {
      await (tool.revokedAt ? restoreAgentTool(tool.id) : revokeAgentTool(tool.id))
      await reload()
    } catch (err) {
      setError(errorDetailOr(err, 'Could not update the agent.'))
    }
  }

  const changePermission = async (tool: AgentTool, permission: AgentPermission): Promise<void> => {
    try {
      await changeAgentToolPermission(tool.id, permission)
      setAgentTools(prev => prev.map(t => (t.id === tool.id ? { ...t, permission } : t)))
    } catch (err) {
      setError(errorDetailOr(err, 'Could not update the permission.'))
    }
  }

  const toggleScope = async (tool: AgentTool, scope: AgentScope): Promise<void> => {
    const has = tool.scopes.includes(scope)
    try {
      await (has ? withdrawAgentToolScope(tool.id, scope) : grantAgentToolScope(tool.id, scope))
      const scopes = has ? tool.scopes.filter(s => s !== scope) : [...tool.scopes, scope]
      setAgentTools(prev => prev.map(t => (t.id === tool.id ? { ...t, scopes } : t)))
    } catch (err) {
      setError(errorDetailOr(err, 'Could not update the scopes.'))
    }
  }

  return { agentTools, error, toggleRevoke, changePermission, toggleScope }
}
