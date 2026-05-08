import type { CSSProperties } from 'react'
import { Outlet } from 'react-router-dom'
import { NavBar } from '@atelier/shared-ui'

const NAV_LINKS = [
  { label: 'Design Lab', to: '/design-lab' },
  { label: 'Admin', to: '/admin' },
]

export function PrivateLayout() {
  return (
    <div style={layoutStyle}>
      <NavBar brand="Atelier" links={NAV_LINKS} />
      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  )
}

const layoutStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-bg)',
}

const mainStyle: CSSProperties = {
  flex: 1,
  backgroundColor: 'var(--color-bg)',
}
