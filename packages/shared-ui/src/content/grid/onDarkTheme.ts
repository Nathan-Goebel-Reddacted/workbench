import type { CSSProperties } from 'react'

export const onDarkSnapshotStyle = {
  '--theme-bg': 'var(--color-bg)',
  '--theme-surface': 'var(--color-surface)',
  '--theme-text': 'var(--color-text)',
  '--theme-border': 'var(--color-border)',
} as CSSProperties

export const onDarkThemeStyle = {
  display: 'contents',
  '--color-bg': 'var(--theme-text)',
  '--color-surface': 'var(--theme-text)',
  '--color-text': 'var(--theme-surface)',
  '--color-text-muted': 'color-mix(in srgb, var(--theme-surface) 78%, var(--theme-text))',
  '--color-border': 'color-mix(in srgb, var(--theme-surface) 30%, var(--theme-text))',
  '--color-primary': 'var(--theme-surface)',
  '--color-primary-hover': 'var(--theme-border)',
  color: 'var(--color-text)',
} as CSSProperties
