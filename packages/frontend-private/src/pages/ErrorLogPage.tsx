import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Button, ConfirmDeleteButton } from '@atelier/shared-ui'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const PAGE_SIZE = 50

type Origin = 'front' | 'back'

type EntryDto = {
  id: string
  origin: Origin
  message: string
  stack: string | null
  url: string | null
  userId: string | null
  correlationId: string | null
  context: Record<string, unknown>
  occurredAt: string
}

type Filters = {
  origin: '' | Origin
  from: string
  to: string
  q: string
}

const EMPTY_FILTERS: Filters = { origin: '', from: '', to: '', q: '' }

/** Une date de fin sans heure exclurait le dernier jour choisi : elle est recalée sur minuit moins un. */
function endOfDay(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString()
}

function buildQuery(filters: Filters, offset: number): string {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
  if (filters.origin) params.set('origin', filters.origin)
  if (filters.from) params.set('from', new Date(filters.from).toISOString())
  if (filters.to) params.set('to', endOfDay(filters.to))
  if (filters.q.trim()) params.set('q', filters.q.trim())
  return params.toString()
}

export function ErrorLogPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [offset, setOffset] = useState(0)
  const [entries, setEntries] = useState<EntryDto[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/error-log?${buildQuery(applied, offset)}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { entries: EntryDto[]; total: number }
      setEntries(data.entries)
      setTotal(data.total)
    } catch {
      setError('Impossible de charger le journal.')
    } finally {
      setLoading(false)
    }
  }, [applied, offset])

  useEffect(() => {
    void load()
  }, [load])

  const search = () => {
    setOffset(0)
    setApplied(filters)
  }

  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setOffset(0)
    setApplied(EMPTY_FILTERS)
  }

  const purge = async () => {
    setError(null)
    try {
      // La purge suit la date de fin affichée : on ne vide que ce que l'écran désigne.
      const before = applied.to ? `?before=${encodeURIComponent(endOfDay(applied.to))}` : ''
      const res = await fetch(`${API_URL}/error-log${before}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setOffset(0)
      await load()
    } catch {
      setError('La purge a échoué.')
    }
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Journal des erreurs</h1>
        <ConfirmDeleteButton
          onConfirm={() => void purge()}
          label={applied.to ? 'Purger jusqu’à la date' : 'Tout purger'}
          confirmLabel="Confirmer la purge"
        />
      </header>

      <section style={filterBarStyle}>
        <select
          value={filters.origin}
          onChange={e => setFilters({ ...filters, origin: e.target.value as Filters['origin'] })}
          style={inputStyle}
          aria-label="Origine"
        >
          <option value="">Toutes origines</option>
          <option value="front">Front</option>
          <option value="back">Back</option>
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters({ ...filters, from: e.target.value })}
          style={inputStyle}
          aria-label="Depuis"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters({ ...filters, to: e.target.value })}
          style={inputStyle}
          aria-label="Jusqu’à"
        />
        <input
          type="search"
          value={filters.q}
          onChange={e => setFilters({ ...filters, q: e.target.value })}
          onKeyDown={e => {
            if (e.key === 'Enter') search()
          }}
          placeholder="Message ou URL"
          style={{ ...inputStyle, flex: 1, minWidth: '12rem' }}
          aria-label="Recherche"
        />
        <Button onClick={search}>Filtrer</Button>
        <Button variant="ghost" onClick={reset}>
          Réinitialiser
        </Button>
      </section>

      {error && <p style={errorStyle}>{error}</p>}

      {loading ? (
        <p style={mutedStyle}>Chargement…</p>
      ) : entries.length === 0 ? (
        <p style={mutedStyle}>Aucune erreur enregistrée.</p>
      ) : (
        <ul style={listStyle}>
          {entries.map(entry => (
            <li key={entry.id} style={rowStyle}>
              <button
                type="button"
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                style={rowHeaderStyle}
              >
                <span style={originBadgeStyle}>{entry.origin}</span>
                <span style={dateStyle}>{new Date(entry.occurredAt).toLocaleString('fr-FR')}</span>
                <span style={messageStyle}>{entry.message}</span>
              </button>
              {expanded === entry.id && (
                <dl style={detailStyle}>
                  {entry.url && <Detail label="URL" value={entry.url} />}
                  {entry.correlationId && <Detail label="Corrélation" value={entry.correlationId} />}
                  {entry.userId && <Detail label="Utilisateur" value={entry.userId} />}
                  {Object.keys(entry.context).length > 0 && (
                    <Detail label="Contexte" value={JSON.stringify(entry.context)} />
                  )}
                  {entry.stack && (
                    <>
                      <dt style={detailLabelStyle}>Trace</dt>
                      <dd style={{ margin: 0 }}>
                        <pre style={stackStyle}>{entry.stack}</pre>
                      </dd>
                    </>
                  )}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}

      <footer style={footerStyle}>
        <span style={mutedStyle}>
          {total === 0 ? '0 entrée' : `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} sur ${total}`}
        </span>
        <div style={paginationStyle}>
          <Button
            variant="secondary"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))}
          >
            Précédent
          </Button>
          <Button
            variant="secondary"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Suivant
          </Button>
        </div>
      </footer>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt style={detailLabelStyle}>{label}</dt>
      <dd style={detailValueStyle}>{value}</dd>
    </>
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

const filterBarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginBottom: '1rem',
}

const inputStyle: CSSProperties = {
  padding: '0.4rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
}

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
  gap: '0.75rem',
  width: '100%',
  padding: '0.625rem 0.75rem',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
}

const originBadgeStyle: CSSProperties = {
  padding: '0.1rem 0.45rem',
  borderRadius: '999px',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
}

const dateStyle: CSSProperties = { color: 'var(--color-text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }

const messageStyle: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

const detailStyle: CSSProperties = {
  margin: 0,
  padding: '0 0.75rem 0.75rem',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '0.25rem 0.75rem',
  fontSize: '0.8125rem',
}

const detailLabelStyle: CSSProperties = { color: 'var(--color-text-muted)' }

const detailValueStyle: CSSProperties = { margin: 0, wordBreak: 'break-all', color: 'var(--color-text)' }

const stackStyle: CSSProperties = {
  margin: 0,
  padding: '0.5rem',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-muted)',
  fontSize: '0.75rem',
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
}

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginTop: '1rem',
}

const paginationStyle: CSSProperties = { display: 'flex', gap: '0.5rem' }

const mutedStyle: CSSProperties = { color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }

const errorStyle: CSSProperties = { color: 'var(--color-primary)', fontSize: '0.875rem', margin: '0 0 1rem' }
