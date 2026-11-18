import type { PageDto, ScreenPage, ScreenSize, ScreenSpec } from './pageTypes'

const WIDEST_FIRST: readonly ScreenSize[] = ['desktop', 'tablet', 'mobile']

export function screenFor(width: number, screens: Readonly<Record<ScreenSize, ScreenSpec>>): ScreenSize {
  return WIDEST_FIRST.find(screen => width >= screens[screen].minViewport) ?? 'mobile'
}

export function pageAt(page: PageDto, screen: ScreenSize, keepHidden = false): ScreenPage {
  return {
    ...page,
    screen,
    referenceWidth: page.screens[screen].width,
    elements: page.elements
      .filter(element => keepHidden || !element.layout[screen].hidden)
      .map(element => ({ ...element, ...element.layout[screen] })),
  }
}
