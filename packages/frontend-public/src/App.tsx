import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, NavBar, PopupProvider } from '@atelier/shared-ui'
import { HomePage } from './pages/HomePage'
import { CvPage } from './pages/CvPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectPage } from './pages/ProjectPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <BrowserRouter>
      <PopupProvider>
        <ThemeProvider apiUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}>
          <NavBar
            brand="Workbench"
            links={[
              { label: 'Projets', to: '/projects' },
              { label: 'CV', to: '/cv' },
            ]}
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
    </BrowserRouter>
  )
}
