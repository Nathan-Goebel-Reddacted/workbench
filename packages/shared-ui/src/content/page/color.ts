import type { ColorValue } from './pageTypes'

export function cssColor(color: ColorValue | null, fallback: string): string {
  if (!color) return fallback
  return 'theme' in color ? `var(${color.theme}, ${fallback})` : color.hex
}
