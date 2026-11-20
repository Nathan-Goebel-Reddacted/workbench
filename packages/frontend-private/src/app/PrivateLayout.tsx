import type { CSSProperties } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { NavBar, ThemeSelect, useAuth } from '@atelier/shared-ui'

const NAV_LINKS = [
  { label: 'Portfolio Editor', to: '/editor' },
  { label: 'Project', to: '/projects' },
  { label: 'Idea', to: '/ideas' },
  { label: 'CV', to: '/cv' },
]

export function PrivateLayout() {
  const { user, logout } = useAuth()

  return (
    <div style={layoutStyle}>
      <NavBar style={navStyle}>
        <Link to="/" style={brandStyle}>
          Workbench
        </Link>
        <NavBar.Spacer />
        {NAV_LINKS.map(link => (
          <NavLink key={link.to} to={link.to} style={linkStyle}>
            {link.label}
          </NavLink>
        ))}
        <ThemeSelect ariaLabel="Theme" />
        {user && (
          <button type="button" onClick={() => void logout()} style={logoutStyle}>
            Log out
          </button>
        )}
      </NavBar>
      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  )
}

const navStyle: CSSProperties = {
  gap: '1.25rem',
}

const brandStyle: CSSProperties = {
  padding: 0,
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--color-text)',
}

function linkStyle({ isActive }: { isActive: boolean }): CSSProperties {
  return {
    padding: 0,
    backgroundColor: 'transparent',
    fontSize: '0.875rem',
    fontWeight: 'normal',
    color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
  }
}

const logoutStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
  fontWeight: 'normal',
}

const layoutStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-bg)',
}

const mainStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-bg)',
}
