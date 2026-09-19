import { DecisionButtons } from '../../../shared/components/DecisionButtons'
import { codeStyle, mutedTdStyle, tdStyle, trStyle } from '../../../shared/components/adminStyles'
import type { Decision } from '../../../shared/domain/decision'
import type { PairingRequest } from '../types'

export function PendingPairingRequestRows({
  requests,
  onDecide,
}: {
  requests: PairingRequest[]
  onDecide: (id: string, decision: Decision) => void
}) {
  return (
    <>
      {requests.map(r => (
        <tr key={r.id} style={trStyle}>
          <td style={tdStyle}>{r.name}</td>
          <td style={mutedTdStyle}>AI agent</td>
          <td style={mutedTdStyle}>
            <span style={codeStyle}>{r.codePrefix}-••••</span> {r.requestedPermission} · {r.requestedScopes.join(', ')}
          </td>
          <td style={{ ...tdStyle, textAlign: 'right' }}>
            <DecisionButtons onDecide={decision => onDecide(r.id, decision)} />
          </td>
        </tr>
      ))}
    </>
  )
}
