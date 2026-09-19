import { DecisionButtons } from '../../../shared/components/DecisionButtons'
import { mutedTdStyle, tdStyle, trStyle } from '../../../shared/components/adminStyles'
import type { Decision } from '../../../shared/domain/decision'
import type { AccessRequest } from '../types'

export function PendingAccessRequestRows({
  requests,
  onDecide,
}: {
  requests: AccessRequest[]
  onDecide: (email: string, decision: Decision) => void
}) {
  return (
    <>
      {requests.map(r => (
        <tr key={r.email} style={trStyle}>
          <td style={tdStyle}>{r.displayName}</td>
          <td style={mutedTdStyle}>User</td>
          <td style={mutedTdStyle}>{r.email}</td>
          <td style={{ ...tdStyle, textAlign: 'right' }}>
            <DecisionButtons onDecide={decision => onDecide(r.email, decision)} />
          </td>
        </tr>
      ))}
    </>
  )
}
