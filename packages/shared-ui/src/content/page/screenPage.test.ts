import { describe, expect, it } from 'vitest'
import { pageAt, screenFor } from './screenPage'
import type { PageDto, PageElementDto } from './pageTypes'

const box = (x: number) => ({ x, y: 0, w: 10, h: 10 })

function element(id: string, hiddenOnMobile = false): PageElementDto {
  return {
    id,
    components: {},
    layout: {
      desktop: { transform: box(100), hidden: false },
      tablet: { transform: box(50), hidden: false },
      mobile: { transform: box(16), hidden: hiddenOnMobile },
    },
  }
}

const page: PageDto = {
  id: 'p',
  pageType: 'portfolio',
  pageRef: 'r',
  version: 1,
  hasContent: true,
  screens: {
    desktop: { width: 1280, maxHeight: 20000, minViewport: 1280 },
    tablet: { width: 768, maxHeight: 40000, minViewport: 768 },
    mobile: { width: 360, maxHeight: 80000, minViewport: 0 },
  },
  elements: [element('a'), element('b', true)],
}

describe('pageAt', () => {
  it('projette la Page sur une taille : sa largeur et le placement de chaque Element', () => {
    const tablet = pageAt(page, 'tablet')

    expect(tablet.referenceWidth).toBe(768)
    expect(tablet.elements.map(e => e.transform.x)).toEqual([50, 50])
  })

  it('retire les Elements masqués dans cette taille', () => {
    expect(pageAt(page, 'mobile').elements.map(e => e.id)).toEqual(['a'])
  })
})

describe('screenFor', () => {
  it.each([
    [1920, 'desktop'],
    [1280, 'desktop'],
    [1279, 'tablet'],
    [768, 'tablet'],
    [767, 'mobile'],
    [320, 'mobile'],
  ] as const)('rend %s px en %s', (width, screen) => {
    expect(screenFor(width, page.screens)).toBe(screen)
  })
})
