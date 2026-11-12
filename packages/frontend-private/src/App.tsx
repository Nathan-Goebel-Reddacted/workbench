import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {
  ApiUrlProvider,
  ThemeProvider,
  AuthProvider,
  ProtectedRoute,
  PopupProvider,
  ErrorReporterProvider,
} from '@atelier/shared-ui'
import { AccessRequestedPage, LoginPage } from './contexts/auth'
import { ThemeEditorPage } from './contexts/theme'
import { ErrorLogPage } from './contexts/error-log'
import { ContactMessagesPage } from './contexts/contact'
import { EditorPage } from './contexts/portfolio'
import { BindingSourceProvider } from './contexts/content-editor'
import { CvPage } from './contexts/cv'
import { ProjectDetailPage, ProjectPageEditorPage, ProjectsPage } from './contexts/project'
import { IdeaDetailPage, IdeasPage } from './contexts/idea'
import { HomePage } from './app/HomePage'
import { AdminPage } from './app/AdminPage'
import { PrivateLayout } from './app/PrivateLayout'
import { bindingSource } from './app/bindingSource'
import { EditPermissionProvider } from './shared/auth/EditPermissionContext'
import { API_URL } from './shared/config'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ApiUrlProvider apiUrl={API_URL}>
        <ErrorReporterProvider>
          <PopupProvider>
            <ThemeProvider>
              <AuthProvider>
                <EditPermissionProvider>
                  <BindingSourceProvider source={bindingSource}>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/access-requested" element={<AccessRequestedPage />} />
                      <Route element={<ProtectedRoute />}>
                        <Route element={<PrivateLayout />}>
                          <Route index element={<HomePage />} />
                          <Route path="/theme-editor" element={<ThemeEditorPage />} />
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
                          <Route element={<ProtectedRoute role="edit" />}>
                            <Route path="/error-log" element={<ErrorLogPage />} />
                            <Route path="/contact-messages" element={<ContactMessagesPage />} />
                          </Route>
                        </Route>
                      </Route>
                    </Routes>
                  </BindingSourceProvider>
                </EditPermissionProvider>
              </AuthProvider>
            </ThemeProvider>
          </PopupProvider>
        </ErrorReporterProvider>
      </ApiUrlProvider>
    </BrowserRouter>
  )
}
