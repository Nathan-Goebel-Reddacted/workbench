import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type NavLink = { label: string; to: string }

type NavBarProps = {
  brand: string
  links?: NavLink[]
  /** Rendu à droite des liens : déconnexion, bascule de thème, ce que la page ajoute. */
  actions?: ReactNode
}

export function NavBar({ brand, links = [], actions }: NavBarProps) {
  return (
    <nav style={navStyle}>
      <Link to="/" style={brandStyle}>
        {brand}
      </Link>
      <div style={rightStyle}>
        {links.map(link => (
          <Link key={link.to} to={link.to} style={linkStyle}>
            {link.label}
          </Link>
        ))}
        {actions}
      </div>
    </nav>
  )
}

const navStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1.5rem',
  height: '56px',
  borderBottom: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
}

const brandStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: '1rem',
  color: 'var(--color-text)',
  textDecoration: 'none',
}

const rightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
}

const linkStyle: CSSProperties = {
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontSize: '0.875rem',
}
