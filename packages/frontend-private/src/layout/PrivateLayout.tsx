import type { CSSProperties } from 'react'
import { Link, Outlet } from 'react-router-dom'
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
      <NavBar
        brand="Workbench"
        links={NAV_LINKS}
        linkAs={Link}
        actions={
          <>
            <ThemeSelect ariaLabel="Thème" />
            {user && (
              <button type="button" onClick={() => void logout()} style={logoutStyle}>
                Déconnexion
              </button>
            )}
          </>
        }
      />
      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  )
}

const logoutStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem',
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
