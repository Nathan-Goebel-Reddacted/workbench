import type { ReactNode } from 'react'
import { ThemeProvider as BaseThemeProvider } from '@-reddacted-/react-ui'
import { useApiUrl } from '../config/ApiUrlContext'
import { workbenchPalette } from './palette'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const apiUrl = useApiUrl()

  return (
    <BaseThemeProvider apiUrl={apiUrl} basePalette={workbenchPalette}>
      {children}
    </BaseThemeProvider>
  )
}
