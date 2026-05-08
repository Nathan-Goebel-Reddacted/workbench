import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@atelier/shared-ui'
import { HomePage } from './pages/HomePage'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider apiUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}
