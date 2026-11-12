import { describe, expect, it } from 'vitest'
import { isBlankLayout } from './types'
import type { PageLayout } from './types'

function layout(sectionCount: number): PageLayout {
  return {
    id: 'l1',
    pageType: 'portfolio',
    pageRef: 'p1',
    sections: Array.from({ length: sectionCount }, (_, i) => ({ id: String(i) })),
  } as PageLayout
}

describe('page publiée sans contenu composé', () => {
  it("tient l'absence de layout pour une page nue, pas pour une panne", () => {
    expect(isBlankLayout(null)).toBe(true)
  })

  it('tient un layout vidé de ses sections pour une page nue', () => {
    expect(isBlankLayout(layout(0))).toBe(true)
  })

  it('rend le layout dès qu’il porte une section', () => {
    expect(isBlankLayout(layout(1))).toBe(false)
  })
})
