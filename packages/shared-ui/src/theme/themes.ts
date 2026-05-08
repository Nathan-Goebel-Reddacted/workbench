export type Theme = 'light' | 'dark'

export const themes = {
  light: {
    '--color-bg': '#ffffff',
    '--color-surface': '#f8fafc',
    '--color-text': '#1a1a1a',
    '--color-text-muted': '#64748b',
    '--color-primary': '#6366f1',
    '--color-primary-hover': '#4f46e5',
    '--color-border': '#e2e8f0',
  },
  dark: {
    '--color-bg': '#0f0f0f',
    '--color-surface': '#1e1e1e',
    '--color-text': '#f1f5f9',
    '--color-text-muted': '#94a3b8',
    '--color-primary': '#818cf8',
    '--color-primary-hover': '#6366f1',
    '--color-border': '#2d2d2d',
  },
} satisfies Record<Theme, Record<string, string>>
