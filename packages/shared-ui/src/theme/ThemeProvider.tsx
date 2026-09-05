import type { ReactNode } from 'react'
import { ThemeProvider as BaseThemeProvider } from '@-reddacted-/react-ui'
import { workbenchPalette } from './palette'

export function ThemeProvider({ children, apiUrl }: { children: ReactNode; apiUrl?: string }) {
  return (
    <BaseThemeProvider apiUrl={apiUrl} basePalette={workbenchPalette}>
      {children}
    </BaseThemeProvider>
  )
}
