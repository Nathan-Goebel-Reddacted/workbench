import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { EDIT_ROLE_REQUIRED, useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { errorStyle, sectionLabelStyle, sectionStyle } from '../../../shared/components/adminStyles'
import { useAllowedEmails } from '../hooks/useAllowedEmails'

export function AllowedEmailsSection({ reloadKey }: { reloadKey: number }) {
  const canEdit = useCanEdit()
  const { allowedEmails, error, allow, disallow } = useAllowedEmails(reloadKey)
  const [newEmail, setNewEmail] = useState('')

  const handleAddEmail = async () => {
    if (await allow(newEmail)) setNewEmail('')
  }

  const lockedTitle = canEdit ? undefined : EDIT_ROLE_REQUIRED

  return (
    <section style={sectionStyle}>
      <p style={sectionLabelStyle}>Allowed emails</p>
      {error && <p style={errorStyle}>{error}</p>}

      <div style={addRowStyle}>
        <input
          type="email"
          placeholder="new@email.com"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddEmail()}
          style={inputStyle}
        />
        <Button variant="primary" onClick={handleAddEmail} disabled={!canEdit || !newEmail.trim()} title={lockedTitle}>
          Add
        </Button>
      </div>

      <ul style={listStyle}>
        {allowedEmails.map(email => (
          <li key={email} style={listItemStyle}>
            <span style={emailSpanStyle}>{email}</span>
            <Button variant="ghost" onClick={() => disallow(email)} disabled={!canEdit} title={lockedTitle}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

const addRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  marginBottom: '1rem',
}

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const listItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--color-border)',
}

const emailSpanStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text)',
}
