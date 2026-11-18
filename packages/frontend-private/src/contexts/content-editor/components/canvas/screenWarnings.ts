import type { PageElementDto, ScreenSize, ScreenSpec } from '@content'

export const EDITED_SCREENS: readonly ScreenSize[] = ['desktop', 'tablet', 'mobile']

export const SMALLEST_WIDTHS: Readonly<Record<ScreenSize, number>> = { desktop: 1024, tablet: 600, mobile: 320 }

export const MIN_READABLE_PX = 11

export type ClippedByScreen = Readonly<Record<ScreenSize, ReadonlySet<string>>>

export type Screens = Readonly<Record<ScreenSize, ScreenSpec>>

export const SCREEN_LABELS: Readonly<Record<ScreenSize, string>> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
}

export function effectiveFontSize(fontSize: number, screen: ScreenSize, screens: Screens): number {
  return (fontSize * SMALLEST_WIDTHS[screen]) / screens[screen].width
}

function shownOn(element: PageElementDto): ScreenSize[] {
  return EDITED_SCREENS.filter(screen => !element.layout[screen].hidden)
}

export function unreadableOn(element: PageElementDto, screens: Screens): ScreenSize[] {
  const text = element.components.text
  if (!text) return []
  return shownOn(element).filter(screen => effectiveFontSize(text.fontSize[screen], screen, screens) < MIN_READABLE_PX)
}

export function clippedOn(element: PageElementDto, clipped: ClippedByScreen): ScreenSize[] {
  return shownOn(element).filter(screen => clipped[screen].has(element.id))
}

export function layoutWarnings(element: PageElementDto, clipped: ClippedByScreen, screens: Screens): string[] {
  const cut = clippedOn(element, clipped)
  const small = unreadableOn(element, screens)
  const names = (list: ScreenSize[]) => list.map(screen => SCREEN_LABELS[screen].toLowerCase()).join(', ')
  return [
    ...(cut.length > 0 ? [`Content cut by its box on ${names(cut)}: enlarge the element there.`] : []),
    ...small.map(
      screen =>
        `Text below ${MIN_READABLE_PX} px on ${SCREEN_LABELS[screen].toLowerCase()} at ${SMALLEST_WIDTHS[screen]} px wide: raise its ${SCREEN_LABELS[screen].toLowerCase()} size.`,
    ),
  ]
}
