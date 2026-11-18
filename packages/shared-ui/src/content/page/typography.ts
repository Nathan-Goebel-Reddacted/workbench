import { createContext } from 'react'
import type { ScreenSize, TextFont } from './pageTypes'

export const RenderScreenContext = createContext<ScreenSize>('desktop')

export const TEXT_FONT_OPTIONS: readonly { value: TextFont; label: string; family: string }[] = [
  { value: 'body', label: 'Body', family: 'var(--font-body)' },
  { value: 'heading', label: 'Heading', family: 'var(--font-heading)' },
]

export function fontFamilyOf(font: TextFont): string {
  return TEXT_FONT_OPTIONS.find(option => option.value === font)?.family ?? 'var(--font-body)'
}
