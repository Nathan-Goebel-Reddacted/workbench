import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button, ConfirmDeleteButton } from '@atelier/shared-ui'
import { EMPTY_FILTERS, useErrorLog, type ErrorLogFilters } from '../hooks/useErrorLog'
import { ORIGINS, type Origin } from '../types'

const ORIGIN_LABELS: Record<Origin, string> = { front: 'Front', back: 'Back' }

export function ErrorLogPage() {
  const [filters, setFilters] = useState<ErrorLogFilters>(EMPTY_FILTERS)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { entries, total, offset, pageSize, applied, error, loading, apply, purge, previousPage, nextPage } =
    useErrorLog()

  const search = () => apply(filters)

  const reset = () => {
    setFilters(EMPTY_FILTERS)
    apply(EMPTY_FILTERS)
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Error log</h1>
        <ConfirmDeleteButton
          onConfirm={() => void purge()}
          label={applied.to ? 'Purge up to the date' : 'Purge all'}
          confirmLabel="Confirm purge"
        />
      </header>

      <section style={filterBarStyle}>
        <select
          value={filters.origin}
          onChange={e => setFilters({ ...filters, origin: e.target.value as ErrorLogFilters['origin'] })}
          style={inputStyle}
          aria-label="Origin"
        >
          <option value="">All origins</option>
          {ORIGINS.map(origin => (
            <option key={origin} value={origin}>
              {ORIGIN_LABELS[origin]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters({ ...filters, from: e.target.value })}
          style={inputStyle}
          aria-label="From"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters({ ...filters, to: e.target.value })}
          style={inputStyle}
          aria-label="Up to"
        />
        <input
          type="search"
          value={filters.q}
          onChange={e => setFilters({ ...filters, q: e.target.value })}
          onKeyDown={e => {
            if (e.key === 'Enter') search()
          }}
          placeholder="Message or URL"
          style={{ ...inputStyle, flex: 1, minWidth: '12rem' }}
          aria-label="Search"
        />
        <Button onClick={search}>Filter</Button>
        <Button variant="ghost" onClick={reset}>
          Reset
        </Button>
      </section>

      {error && <p style={errorStyle}>{error}</p>}

      {loading ? (
        <p style={mutedStyle}>Loading…</p>
      ) : entries.length === 0 ? (
        <p style={mutedStyle}>No error recorded.</p>
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
                <span style={dateStyle}>{new Date(entry.occurredAt).toLocaleString('en-GB')}</span>
                <span style={messageStyle}>{entry.message}</span>
              </button>
              {expanded === entry.id && (
                <dl style={detailStyle}>
                  {entry.url && <Detail label="URL" value={entry.url} />}
                  {entry.correlationId && <Detail label="Correlation" value={entry.correlationId} />}
                  {entry.userId && <Detail label="User" value={entry.userId} />}
                  {Object.keys(entry.context).length > 0 && (
                    <Detail label="Context" value={JSON.stringify(entry.context)} />
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
          {total === 0 ? '0 entries' : `${offset + 1}–${Math.min(offset + pageSize, total)} of ${total}`}
        </span>
        <div style={paginationStyle}>
          <Button variant="secondary" disabled={offset === 0} onClick={previousPage}>
            Previous
          </Button>
          <Button variant="secondary" disabled={offset + pageSize >= total} onClick={nextPage}>
            Next
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
