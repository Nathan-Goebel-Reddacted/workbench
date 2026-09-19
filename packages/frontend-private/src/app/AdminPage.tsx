import type { CSSProperties } from 'react'
import { useState } from 'react'
import {
  emptyStyle,
  errorStyle,
  sectionLabelStyle,
  sectionStyle,
  tableStyle,
  thStyle,
} from '../shared/components/adminStyles'
import type { Decision } from '../shared/domain/decision'
import { AllowedEmailsSection, PendingAccessRequestRows, useAccessRequests } from '../contexts/auth'
import { AgentToolsSection, PendingPairingRequestRows, usePairingRequests } from '../contexts/ai-assistant'
import { UsersSection } from '../contexts/user'

export function AdminPage() {
  const accessRequests = useAccessRequests()
  const pairingRequests = usePairingRequests()
  const [allowedEmailsReloadKey, setAllowedEmailsReloadKey] = useState(0)
  const [agentToolsReloadKey, setAgentToolsReloadKey] = useState(0)

  const handleHumanRequest = async (email: string, decision: Decision) => {
    await accessRequests.decide(email, decision)
    setAllowedEmailsReloadKey(key => key + 1)
  }

  const handleAgentRequest = async (id: string, decision: Decision) => {
    await pairingRequests.decide(id, decision)
    setAgentToolsReloadKey(key => key + 1)
  }

  const pendingHumans = accessRequests.pending
  const pendingAgents = pairingRequests.pending
  const pendingCount = pendingHumans.length + pendingAgents.length
  const requestsErrors = [accessRequests.error, pairingRequests.error].filter(Boolean)

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Administration</h1>
      </div>

      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>Access requests{pendingCount > 0 ? ` (${pendingCount})` : ''}</p>
        {requestsErrors.map(error => (
          <p key={error} style={errorStyle}>
            {error}
          </p>
        ))}

        {pendingCount === 0 && requestsErrors.length === 0 && <p style={emptyStyle}>No pending request.</p>}

        {pendingCount > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Requester</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Detail</th>
                <th style={{ ...thStyle, width: '190px' }} />
              </tr>
            </thead>
            <tbody>
              <PendingAccessRequestRows requests={pendingHumans} onDecide={handleHumanRequest} />
              <PendingPairingRequestRows requests={pendingAgents} onDecide={handleAgentRequest} />
            </tbody>
          </table>
        )}
      </section>

      <UsersSection />
      <AgentToolsSection reloadKey={agentToolsReloadKey} />
      <AllowedEmailsSection reloadKey={allowedEmailsReloadKey} />
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem', maxWidth: '900px', margin: '0 auto' }
const headerStyle: CSSProperties = { marginBottom: '1.75rem' }
const titleStyle: CSSProperties = { fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }
