import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { useFeatureTickets } from '../hooks/useFeatureTickets'
import { CreateTicketModal } from './CreateTicketModal'
import { TicketRow } from './TicketRow'

export function FeatureTickets({
  featureId,
  onCountChange,
}: {
  featureId: string
  onCountChange: (count: number) => void
}) {
  const canEdit = useCanEdit()
  const { tickets, loading, error, create, patch, forget } = useFeatureTickets(featureId)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    onCountChange(tickets.length)
  }, [tickets.length, onCountChange])

  const handleAddTicket = async (title: string, description: string) => {
    if (await create({ title, description })) setCreateModalOpen(false)
  }

  return (
    <>
      {loading && <p style={mutedStyle}>Loading tickets…</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {tickets.map(t => (
        <TicketRow key={t.id} ticket={t} onUpdate={patch} onDelete={forget} />
      ))}

      <Button
        variant="ghost"
        onClick={() => canEdit && setCreateModalOpen(true)}
        disabled={!canEdit}
        style={addTicketBtnStyle}
      >
        + New ticket
      </Button>

      {createModalOpen && <CreateTicketModal onClose={() => setCreateModalOpen(false)} onCreate={handleAddTicket} />}
    </>
  )
}

const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }
const addTicketBtnStyle: CSSProperties = { marginTop: '0.75rem', alignSelf: 'flex-start', fontSize: '0.8125rem' }
