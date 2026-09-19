import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { EDIT_ROLE_REQUIRED, useCanEdit } from '../../../shared/auth/EditPermissionContext'
import {
  codeStyle,
  emptyStyle,
  errorStyle,
  mutedTdStyle,
  sectionLabelStyle,
  sectionStyle,
  tableStyle,
  tdStyle,
  thStyle,
  trStyle,
} from '../../../shared/components/adminStyles'
import { useAgentTools } from '../hooks/useAgentTools'
import { useTokenRotation } from '../hooks/useTokenRotation'
import { AGENT_PERMISSIONS, AGENT_SCOPES, type AgentPermission, type AgentTool } from '../types'

export function AgentToolsSection({ reloadKey }: { reloadKey: number }) {
  const canEdit = useCanEdit()
  const { agentTools, error, toggleRevoke, changePermission, toggleScope } = useAgentTools(reloadKey)
  const [rotating, setRotating] = useState<AgentTool | null>(null)

  const lockedTitle = canEdit ? undefined : EDIT_ROLE_REQUIRED

  return (
    <section style={sectionStyle}>
      <p style={sectionLabelStyle}>AI agents</p>
      {error && <p style={errorStyle}>{error}</p>}

      {agentTools.length === 0 && !error && <p style={emptyStyle}>No paired agent.</p>}

      {agentTools.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Agent</th>
              <th style={thStyle}>Owner</th>
              <th style={{ ...thStyle, width: '130px' }}>Permission</th>
              <th style={thStyle}>Scopes</th>
              <th style={{ ...thStyle, width: '110px' }}>Created</th>
              <th style={{ ...thStyle, width: '110px' }} />
            </tr>
          </thead>
          <tbody>
            {agentTools.map(t => {
              const revoked = t.revokedAt !== null
              return (
                <tr key={t.id} style={{ ...trStyle, opacity: revoked ? 0.5 : 1 }}>
                  <td style={tdStyle}>
                    {t.name}
                    {revoked && <span style={revokedBadgeStyle}>revoked</span>}
                  </td>
                  <td style={mutedTdStyle}>{t.ownerName ?? '—'}</td>
                  <td style={tdStyle}>
                    <select
                      value={t.permission}
                      onChange={e => changePermission(t, e.target.value as AgentPermission)}
                      disabled={!canEdit || revoked}
                      title={lockedTitle}
                      style={selectStyle}
                    >
                      {AGENT_PERMISSIONS.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <div style={scopeRowStyle}>
                      {AGENT_SCOPES.map(scope => {
                        const checked = t.scopes.includes(scope)
                        const isLast = checked && t.scopes.length === 1
                        return (
                          <label
                            key={scope}
                            style={{ ...scopeLabelStyle, opacity: checked ? 1 : 0.45 }}
                            title={isLast ? 'An agent must keep at least one scope' : undefined}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleScope(t, scope)}
                              disabled={!canEdit || revoked || isLast}
                              style={{ cursor: canEdit && !revoked && !isLast ? 'pointer' : 'not-allowed' }}
                            />
                            {scope}
                          </label>
                        )
                      })}
                    </div>
                  </td>
                  <td style={mutedTdStyle}>{new Date(t.createdAt).toLocaleDateString('en-GB')}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Button variant="ghost" onClick={() => toggleRevoke(t)} disabled={!canEdit} title={lockedTitle}>
                      {revoked ? 'Restore' : 'Revoke'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setRotating(t)}
                      disabled={!canEdit || revoked}
                      title={!canEdit ? EDIT_ROLE_REQUIRED : revoked ? 'Agent revoked' : 'Rotate token'}
                    >
                      Rotate
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {rotating && <TokenRotationModal tool={rotating} onClose={() => setRotating(null)} />}
    </section>
  )
}

function TokenRotationModal({ tool, onClose }: { tool: AgentTool; onClose: () => void }) {
  const { token, error: rotationError, rotate } = useTokenRotation(tool.id)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const error = copyError ?? rotationError

  const handleCopyToken = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
    } catch {
      setCopyError('Copy failed — select the token to copy it by hand.')
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <p style={sectionLabelStyle}>Token of agent {tool.name}</p>
        {error && <p style={errorStyle}>{error}</p>}

        {token === null ? (
          <>
            <p style={modalTextStyle}>
              Rotating the token cuts this agent off right away: its current token stops working and the new one must be
              pasted into its MCP configuration.
            </p>
            <div style={modalActionsStyle}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={rotate}>
                Rotate
              </Button>
            </div>
          </>
        ) : (
          <>
            <p style={modalTextStyle}>
              The server only keeps a hash: this is the only moment the token can be read. Closing this window without
              copying it means rotating another one.
            </p>
            <input readOnly value={token} style={tokenInputStyle} onFocus={e => e.target.select()} />
            <div style={modalActionsStyle}>
              <Button variant="ghost" onClick={handleCopyToken}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const selectStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  padding: '0.25rem 0.375rem',
  outline: 'none',
}

const scopeRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
}

const scopeLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontSize: '0.75rem',
  color: 'var(--color-text)',
}

const revokedBadgeStyle: CSSProperties = {
  marginLeft: '0.5rem',
  fontSize: '0.6875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  padding: '0.0625rem 0.3125rem',
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'color-mix(in srgb, var(--color-text) 45%, transparent)',
  padding: '1rem',
  zIndex: 100,
}

const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: '480px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
}

const modalTextStyle: CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: 1.5,
  color: 'var(--color-text-muted)',
  margin: '0 0 1rem',
}

const tokenInputStyle: CSSProperties = {
  ...codeStyle,
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.5rem 0.625rem',
  marginBottom: '1rem',
}

const modalActionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
}
