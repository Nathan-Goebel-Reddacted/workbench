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
                  <ThemeSelect ariaLabel="Thème" />
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
