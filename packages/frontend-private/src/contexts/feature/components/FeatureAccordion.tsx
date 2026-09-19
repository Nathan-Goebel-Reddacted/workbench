import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { FeatureTickets } from '../../ticket'
import { useFeature } from '../hooks/useFeature'
import type { Feature } from '../types'

export function FeatureAccordion({ feature, onDelete }: { feature: Feature; onDelete: (id: string) => void }) {
  const canEdit = useCanEdit()
  const [open, setOpen] = useState(false)
  const [ticketCount, setTicketCount] = useState(0)

  const [name, setName] = useState(feature.name)
  const [description, setDescription] = useState(feature.description)
  const { saving, deleting, error, save, deletionImpact, remove } = useFeature(feature.id)

  const handleDeleteFeature = async () => {
    const impact = await deletionImpact()
    if (!impact) return
    const warning =
      impact.tickets > 0
        ? `Delete the feature “${feature.name}” and its ${impact.tickets} ticket${impact.tickets > 1 ? 's' : ''}?`
        : `Delete the feature “${feature.name}”?`
    if (!window.confirm(warning)) return
    if (await remove()) onDelete(feature.id)
  }

  const handleSaveFeature = () => save({ name, description })

  return (
    <div style={accordionStyle}>
      <div
        style={accordionHeaderStyle}
        onClick={() => setOpen(o => !o)}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        <span style={chevronStyle}>{open ? '▾' : '▸'}</span>
        {feature.reference && <span style={featureRefStyle}>{feature.reference}</span>}
        <span style={featureNameStyle}>{feature.name}</span>
        <span style={ticketCountStyle}>{open && ticketCount > 0 ? `${ticketCount} tickets` : ''}</span>
      </div>

      {open && (
        <div style={accordionBodyStyle}>
          <div style={featureEditStyle}>
            {error && <p style={errorStyle}>{error}</p>}
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              readOnly={!canEdit}
              style={{ ...featureInputStyle, cursor: canEdit ? 'text' : 'default' }}
              placeholder="Feature name"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              readOnly={!canEdit}
              style={{
                ...featureInputStyle,
                resize: canEdit ? 'vertical' : 'none',
                cursor: canEdit ? 'text' : 'default',
              }}
              placeholder="Description"
            />
            <div style={featureActionsStyle}>
              <Button
                variant="ghost"
                onClick={handleDeleteFeature}
                disabled={!canEdit || deleting}
                style={{ color: 'var(--color-primary)' }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
              <Button variant="secondary" onClick={handleSaveFeature} disabled={!canEdit || saving || !name.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          <FeatureTickets featureId={feature.id} onCountChange={setTicketCount} />
        </div>
      )}
    </div>
  )
}

const featureRefStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  marginRight: '0.5rem',
}
const accordionStyle: CSSProperties = { borderBottom: '1px solid var(--color-border)', marginBottom: '0.25rem' }
const accordionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.625rem 0',
  cursor: 'pointer',
  userSelect: 'none',
}
const chevronStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)', width: '12px' }
const featureNameStyle: CSSProperties = { flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }
const ticketCountStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
const accordionBodyStyle: CSSProperties = { padding: '0.5rem 0 0.75rem 1.25rem' }
const featureEditStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '1rem',
}
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)', margin: 0 }
const featureActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const featureInputStyle: CSSProperties = {
  padding: '0.4rem 0.6rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
