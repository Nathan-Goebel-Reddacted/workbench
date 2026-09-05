import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, AuthProvider, ProtectedRoute, PopupProvider, ErrorReporterProvider } from '@atelier/shared-ui'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { AccessRequestedPage } from './pages/AccessRequestedPage'
import { ThemeEditorPage } from './pages/ThemeEditorPage'
import { ErrorLogPage } from './pages/ErrorLogPage'
import { AdminPage } from './pages/AdminPage'
import { EditorPage } from './pages/EditorPage'
import { CvPage } from './pages/CvPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectPageEditorPage } from './pages/ProjectPageEditorPage'
import { IdeasPage } from './pages/IdeasPage'
import { IdeaDetailPage } from './pages/IdeaDetailPage'
import { PrivateLayout } from './layout/PrivateLayout'
import { EditPermissionProvider } from './contexts/EditPermissionContext'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ErrorReporterProvider apiUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}>
        <PopupProvider>
          <ThemeProvider apiUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}>
            <AuthProvider>
              <EditPermissionProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/access-requested" element={<AccessRequestedPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<PrivateLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="/theme-editor" element={<ThemeEditorPage />} />
                      <Route path="/error-log" element={<ErrorLogPage />} />
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/projects/:id" element={<ProjectDetailPage />} />
                      <Route path="/projects/:id/page" element={<ProjectPageEditorPage />} />
                      <Route path="/ideas" element={<IdeasPage />} />
                      <Route path="/ideas/:id" element={<IdeaDetailPage />} />
                      <Route path="/editor" element={<EditorPage />} />
                      <Route path="/cv" element={<CvPage />} />
                      <Route element={<ProtectedRoute role="view" />}>
                        <Route path="/admin" element={<AdminPage />} />
                      </Route>
                    </Route>
                  </Route>
                </Routes>
              </EditPermissionProvider>
            </AuthProvider>
          </ThemeProvider>
        </PopupProvider>
      </ErrorReporterProvider>
    </BrowserRouter>
  )
}
