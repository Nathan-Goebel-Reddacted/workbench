import type { CSSProperties } from 'react'
import { GridBuilder } from '../../content-editor'
import { usePortfolio } from '../hooks/usePortfolio'

export function EditorPage() {
  const { portfolio, loading } = usePortfolio()

  return (
    <div style={pageStyle}>
      {loading ? (
        <p style={mutedStyle}>Loading…</p>
      ) : !portfolio ? (
        <p style={mutedStyle}>No portfolio has been created for this site.</p>
      ) : (
        <GridBuilder pageType="portfolio" pageRef={portfolio.id} />
      )}
    </div>
  )
}

const pageStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '2rem' }
