import type { ComponentKind, ElementComponents, ScreenSize } from '@content'

export type PanelProps<K extends ComponentKind> = {
  value: NonNullable<ElementComponents[K]>
  onChange: (value: NonNullable<ElementComponents[K]>) => void
  beginInteraction: () => () => void
  showSlide: (index: number) => void
  screen: ScreenSize
}
