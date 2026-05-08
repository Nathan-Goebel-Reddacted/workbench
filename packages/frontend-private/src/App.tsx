import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, AuthProvider, ProtectedRoute } from '@atelier/shared-ui'
import { LoginPage } from './pages/LoginPage'
import { DesignLabPage } from './pages/DesignLabPage'
import { AdminPage } from './pages/AdminPage'
import { PrivateLayout } from './layout/PrivateLayout'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider apiUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<PrivateLayout />}>
                <Route index element={<Navigate to="/design-lab" replace />} />
                <Route path="/design-lab" element={<DesignLabPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
