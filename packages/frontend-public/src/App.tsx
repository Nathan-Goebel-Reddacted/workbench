import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
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
import { API_URL } from './shared/config'

export function App() {
  return (
    <BrowserRouter>
      <ApiUrlProvider apiUrl={API_URL}>
        <ErrorReporterProvider>
          <PopupProvider>
            <ThemeProvider>
              <NavBar
                brand="Workbench"
                links={[
                  { label: 'Projets', to: '/projects' },
                  { label: 'CV', to: '/cv' },
                ]}
                linkAs={Link}
                actions={<ThemeSelect ariaLabel="Thème" />}
              />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectPage />} />
                <Route path="/cv" element={<CvPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ThemeProvider>
          </PopupProvider>
        </ErrorReporterProvider>
      </ApiUrlProvider>
    </BrowserRouter>
  )
}
