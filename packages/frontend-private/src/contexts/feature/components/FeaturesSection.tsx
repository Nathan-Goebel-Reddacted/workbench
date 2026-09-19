import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { useFeatures } from '../hooks/useFeatures'
import type { OwnerType } from '../types'
import { FeatureAccordion } from './FeatureAccordion'

type SectionProps = {
  ownerType: OwnerType
  ownerId: string
}

export function FeaturesSection({ ownerType, ownerId }: SectionProps) {
  const canEdit = useCanEdit()
  const { features, loading, error, create, forget } = useFeatures(ownerType, ownerId)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const handleAddFeature = async () => {
    if (await create({ name: newName, description: newDesc })) {
      setNewName('')
      setNewDesc('')
    }
  }

  return (
    <section style={sectionStyle}>
      <p style={labelStyle}>Features</p>
      {error && <p style={errorStyle}>{error}</p>}
      {loading && <p style={mutedStyle}>Loading features…</p>}
      {features.map(f => (
        <FeatureAccordion key={f.id} feature={f} onDelete={forget} />
      ))}
      <div style={addFeatureStyle}>
        <input
          placeholder="Feature name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={!canEdit}
          style={addInputStyle}
        />
        <input
          placeholder="Description (optional)"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          disabled={!canEdit}
          style={addInputStyle}
        />
        <Button
          variant="primary"
          onClick={handleAddFeature}
          disabled={!canEdit || !newName.trim()}
          style={{ gridColumn: 'span 2' }}
        >
          Add a feature
        </Button>
      </div>
    </section>
  )
}

const sectionStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  padding: '1.25rem',
  marginBottom: '1.5rem',
}
const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0 0 1rem',
}
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)' }
const errorStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }
const addFeatureStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto auto',
  gap: '0.5rem',
  alignItems: 'center',
  marginTop: '1rem',
}
const addInputStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}
