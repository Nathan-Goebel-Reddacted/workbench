import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type Theme, themes } from './themes'

const CUSTOM_COLORS_KEY = 'custom-colors'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  customColors: Record<string, string>
  saveCustomColors: (colors: Record<string, string>) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

type ThemeProviderProps = {
  children: ReactNode
  apiUrl?: string
}

export function ThemeProvider({ children, apiUrl }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) ?? 'light'
  )

  const [customColors, setCustomColors] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY) ?? '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    for (const [key, value] of Object.entries(themes[theme])) {
      document.documentElement.style.setProperty(key, value)
    }
    for (const [key, value] of Object.entries(customColors)) {
      document.documentElement.style.setProperty(key, value)
    }
    localStorage.setItem('theme', theme)
  }, [theme, customColors])

  useEffect(() => {
    if (!apiUrl) return
    fetch(`${apiUrl}/theme`)
      .then(res => res.ok ? res.json() as Promise<{ customColors: Record<string, string> }> : null)
      .then(data => {
        if (!data) return
        setCustomColors(data.customColors)
        localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(data.customColors))
      })
      .catch(() => {})
  }, [apiUrl])

  const saveCustomColors = (colors: Record<string, string>) => {
    setCustomColors(colors)
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors))
    if (apiUrl) {
      fetch(`${apiUrl}/theme`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customColors: colors }),
      }).catch(() => {})
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, customColors, saveCustomColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
