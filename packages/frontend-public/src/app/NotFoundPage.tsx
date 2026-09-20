import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page introuvable')
  return (
    <main style={pageStyle}>
      <p style={codeStyle}>404</p>
      <h1 style={titleStyle}>Cette page n’existe pas</h1>
      <p style={mutedStyle}>Le lien est peut-être erroné ou la page a été retirée.</p>
      <nav style={linksStyle}>
        <Link to="/" style={linkStyle}>
          Accueil
        </Link>
        <Link to="/projects" style={linkStyle}>
          Projets
        </Link>
        <Link to="/cv" style={linkStyle}>
          CV
        </Link>
      </nav>
    </main>
  )
}

const pageStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '2rem',
  textAlign: 'center',
  backgroundColor: 'var(--color-bg)',
}
const codeStyle: CSSProperties = {
  margin: 0,
  fontSize: '3rem',
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--color-primary)',
}
const titleStyle: CSSProperties = { margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)' }
const mutedStyle: CSSProperties = { margin: 0, fontSize: '0.9375rem', color: 'var(--color-text-muted)' }
const linksStyle: CSSProperties = { display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }
const linkStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-primary)' }
