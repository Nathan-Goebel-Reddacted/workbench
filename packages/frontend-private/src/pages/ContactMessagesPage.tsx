import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDeleteButton } from '@atelier/shared-ui'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type MessageDto = {
  id: string
  fields: { label: string; value: string }[]
  senderEmail: string | null
  submittedAt: string
  mailSent: boolean
}

function summaryOf(message: MessageDto): string {
  return message.senderEmail ?? message.fields[0]?.value ?? ''
}

export function ContactMessagesPage() {
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/contact`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMessages((await res.json()) as MessageDto[])
    } catch {
      setError('Impossible de charger les messages.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async (path: string) => {
    setError(null)
    try {
      const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch {
      setError('La suppression a échoué.')
    }
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Messages de contact</h1>
        {messages.length > 0 && (
          <ConfirmDeleteButton
            onConfirm={() => void remove('/contact')}
            label="Tout supprimer"
            confirmLabel="Confirmer la suppression"
          />
        )}
      </header>

      {error && <p style={errorStyle}>{error}</p>}

      {loading ? (
        <p style={mutedStyle}>Chargement…</p>
      ) : messages.length === 0 ? (
        <p style={mutedStyle}>Aucun message reçu.</p>
      ) : (
        <ul style={listStyle}>
          {messages.map(message => (
            <li key={message.id} style={rowStyle}>
              <div style={rowHeaderStyle}>
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === message.id ? null : message.id)}
                  style={toggleStyle}
                >
                  {!message.mailSent && (
                    <span style={warningStyle} title="Non envoyé par mail" aria-label="Non envoyé par mail">
                      ⚠
                    </span>
                  )}
                  <span style={dateStyle}>{new Date(message.submittedAt).toLocaleString('fr-FR')}</span>
                  <span style={summaryStyle}>{summaryOf(message)}</span>
                </button>
                <ConfirmDeleteButton
                  onConfirm={() => void remove(`/contact/${encodeURIComponent(message.id)}`)}
                  label="Supprimer"
                  confirmLabel="Confirmer"
                />
              </div>
              {expanded === message.id && (
                <dl style={detailStyle}>
                  {message.fields.map((field, index) => (
                    <div key={index} style={{ display: 'contents' }}>
                      <dt style={detailLabelStyle}>{field.label}</dt>
                      <dd style={detailValueStyle}>{field.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const pageStyle: CSSProperties = { padding: '2rem', maxWidth: '900px', margin: '0 auto' }

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginBottom: '1.5rem',
}

const titleStyle: CSSProperties = { fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }

const listStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }

const rowStyle: CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  backgroundColor: 'var(--color-surface)',
  overflow: 'hidden',
}

const rowHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  paddingRight: '0.75rem',
}

const toggleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flex: 1,
  minWidth: 0,
  padding: '0.625rem 0.75rem',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
}

const warningStyle: CSSProperties = { color: 'var(--color-primary)', fontSize: '0.875rem' }

const dateStyle: CSSProperties = { color: 'var(--color-text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }

const summaryStyle: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

const detailStyle: CSSProperties = {
  margin: 0,
  padding: '0 0.75rem 0.75rem',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '0.25rem 0.75rem',
  fontSize: '0.8125rem',
}

const detailLabelStyle: CSSProperties = { color: 'var(--color-text-muted)' }

const detailValueStyle: CSSProperties = {
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  color: 'var(--color-text)',
}

const mutedStyle: CSSProperties = { color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }

const errorStyle: CSSProperties = { color: 'var(--color-primary)', fontSize: '0.875rem', margin: '0 0 1rem' }
