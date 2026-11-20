import type { PageElementDto, ScreenSize } from '@content'

export const EDITED_SCREENS: readonly ScreenSize[] = ['desktop', 'tablet', 'mobile']

export const MIN_READABLE_PX = 11

export type ClippedByScreen = Readonly<Record<ScreenSize, ReadonlySet<string>>>

export const SCREEN_LABELS: Readonly<Record<ScreenSize, string>> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
}

function shownOn(element: PageElementDto): ScreenSize[] {
  return EDITED_SCREENS.filter(screen => !element.layout[screen].hidden)
}

export function unreadableOn(element: PageElementDto): ScreenSize[] {
  const text = element.components.text
  if (!text) return []
  return shownOn(element).filter(screen => text.fontSize[screen] < MIN_READABLE_PX)
}

export function clippedOn(element: PageElementDto, clipped: ClippedByScreen): ScreenSize[] {
  return shownOn(element).filter(screen => clipped[screen].has(element.id))
}

export function layoutWarnings(element: PageElementDto, clipped: ClippedByScreen): string[] {
  const cut = clippedOn(element, clipped)
  const small = unreadableOn(element)
  const names = (list: ScreenSize[]) => list.map(screen => SCREEN_LABELS[screen].toLowerCase()).join(', ')
  return [
    ...(cut.length > 0 ? [`Content cut by its box on ${names(cut)}: enlarge the element there.`] : []),
    ...small.map(
      screen =>
        `Text below ${MIN_READABLE_PX} px on ${SCREEN_LABELS[screen].toLowerCase()}: raise its ${SCREEN_LABELS[screen].toLowerCase()} size.`,
    ),
  ]
}
