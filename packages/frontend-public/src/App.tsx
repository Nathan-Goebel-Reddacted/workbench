import type { CSSProperties } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import {
  ApiUrlProvider,
  ThemeProvider,
  NavBar,
  PopupProvider,
  ThemeSelect,
  ErrorReporterProvider,
} from '@atelier/shared-ui'
import { HomePage } from './app/HomePage'
import { NotFoundPage } from './app/NotFoundPage'
import { CvPage } from './contexts/cv'
import { ProjectsPage, ProjectPage } from './contexts/project'
import { SiteGate } from './contexts/site'
import { API_URL } from './shared/config'

export function App() {
  return (
    <BrowserRouter>
      <ApiUrlProvider apiUrl={API_URL}>
        <ErrorReporterProvider>
          <PopupProvider>
            <ThemeProvider>
              <SiteGate>
                <NavBar style={navStyle}>
                  <Link to="/" style={brandStyle}>
                    Workbench
                  </Link>
                  <NavBar.Spacer />
                  <NavLink to="/projects" style={linkStyle}>
                    Projets
                  </NavLink>
                  <NavLink to="/cv" style={linkStyle}>
                    CV
                  </NavLink>
                  <ThemeSelect ariaLabel="Thème" style={themeSelectStyle} />
                </NavBar>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectPage />} />
                  <Route path="/cv" element={<CvPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </SiteGate>
            </ThemeProvider>
          </PopupProvider>
        </ErrorReporterProvider>
      </ApiUrlProvider>
    </BrowserRouter>
  )
}

// Interpolates from `min` px on a 320 px wide screen to `max` px from 480 px up.
function fluid(min: number, max: number): string {
  const slope = (max - min) * 0.625
  const offset = min - (max - min) * 2
  return `clamp(${min}px, calc(${slope}vw ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}px), ${max}px)`
}

const navStyle: CSSProperties = {
  height: fluid(48, 56),
  paddingInline: fluid(12, 24),
  gap: fluid(12, 20),
}

const brandStyle: CSSProperties = {
  padding: 0,
  fontSize: fluid(14, 16),
  fontWeight: 600,
  color: 'var(--color-text)',
}

function linkStyle({ isActive }: { isActive: boolean }): CSSProperties {
  return {
    padding: 0,
    backgroundColor: 'transparent',
    fontSize: fluid(13, 14),
    fontWeight: 'normal',
    color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
  }
}

const themeSelectStyle: CSSProperties = {
  width: fluid(70, 90),
  paddingInline: fluid(4, 8),
}
