import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { GridBuilder } from '../components/grid-builder/GridBuilder'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type PortfolioDto = { id: string }

export function EditorPage() {
  const [portfolio, setPortfolio] = useState<PortfolioDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/portfolio`, { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? (res.json() as Promise<PortfolioDto | null>) : null))
      .then(data => {
        setPortfolio(data)
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <div style={pageStyle}>
      {loading ? (
        <p style={mutedStyle}>Chargement…</p>
      ) : !portfolio ? (
        <p style={mutedStyle}>Aucun portfolio n'a été créé pour ce site.</p>
      ) : (
        <GridBuilder pageType="portfolio" pageRef={portfolio.id} apiUrl={API_URL} />
      )}
    </div>
  )
}

const pageStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '2rem' }
