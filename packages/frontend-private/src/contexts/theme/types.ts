export type ThemeColors = Record<string, string>

export type Theme = {
  id: string
  name: string
  visible: boolean
  colors: ThemeColors
}

export type ThemeCatalog = { themes: Theme[]; defaultId: string | null }
