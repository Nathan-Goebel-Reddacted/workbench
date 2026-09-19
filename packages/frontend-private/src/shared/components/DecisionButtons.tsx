import { Button } from '@atelier/shared-ui'
import { EDIT_ROLE_REQUIRED, useCanEdit } from '../auth/EditPermissionContext'
import type { Decision } from '../domain/decision'

export function DecisionButtons({ onDecide }: { onDecide: (decision: Decision) => void }) {
  const canEdit = useCanEdit()
  const title = canEdit ? undefined : EDIT_ROLE_REQUIRED

  return (
    <>
      <Button variant="primary" onClick={() => onDecide('approve')} disabled={!canEdit} title={title}>
        Approve
      </Button>{' '}
      <Button variant="ghost" onClick={() => onDecide('reject')} disabled={!canEdit} title={title}>
        Reject
      </Button>
    </>
  )
}
