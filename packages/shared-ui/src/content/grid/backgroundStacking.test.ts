import { describe, expect, it } from 'vitest'
import { backgroundColorForDepth, computeBackgroundDepths, computeSectionsOnDark } from './backgroundStacking'
import { readBackgroundContent, type SectionDto } from '../section/types'

function section(id: string, type: SectionDto['type'], x: number, y: number, w: number, h: number, content = {}) {
  return { id, type, x, y, w, h, content } as SectionDto
}

function onDarkOf(sections: SectionDto[]) {
  return computeSectionsOnDark(sections, computeBackgroundDepths(sections))
}

describe('computeSectionsOnDark', () => {
  it('marque un widget posé sur un fond sombre', () => {
    const sections = [section('card', 'background', 0, 0, 6, 4, { dark: true }), section('title', 'text', 1, 1, 4, 1)]

    expect(onDarkOf(sections)).toEqual(new Set(['title']))
  })

  it('ne marque pas un widget posé sur un fond clair pris dans un fond sombre', () => {
    const sections = [
      section('card', 'background', 0, 0, 6, 6, { dark: true }),
      section('inset', 'background', 1, 1, 4, 4),
      section('title', 'text', 2, 2, 2, 1),
      section('caption', 'text', 1, 5, 4, 1),
    ]

    expect(onDarkOf(sections)).toEqual(new Set(['caption']))
  })

  it('ne marque ni un widget hors de tout fond ni les fonds eux-mêmes', () => {
    const sections = [section('card', 'background', 0, 0, 6, 4, { dark: true }), section('free', 'text', 7, 0, 4, 1)]

    expect(onDarkOf(sections)).toEqual(new Set())
  })

  it('garde un widget à cheval sur le bord d’un fond sombre hors de l’inversion', () => {
    const sections = [section('card', 'background', 0, 0, 6, 4, { dark: true }), section('wide', 'text', 4, 1, 4, 1)]

    expect(onDarkOf(sections)).toEqual(new Set())
  })
})

describe('backgroundColorForDepth', () => {
  it('alterne surface et fond selon la profondeur, sauf pour un fond sombre', () => {
    expect(backgroundColorForDepth(0)).toBe('var(--color-surface)')
    expect(backgroundColorForDepth(1)).toBe('var(--color-bg)')
    expect(backgroundColorForDepth(1, true)).toBe('var(--color-text)')
  })

  it('compte un fond sombre dans la profondeur des fonds qu’il contient', () => {
    const depths = computeBackgroundDepths([
      section('card', 'background', 0, 0, 6, 6, { dark: true }),
      section('inset', 'background', 1, 1, 4, 4),
    ])

    expect(depths.get('inset')).toBe(1)
  })
})

describe('readBackgroundContent', () => {
  it('lit un fond enregistré avant l’option sombre comme un fond clair', () => {
    expect(readBackgroundContent({ radius: 8, border: false })).toEqual({ radius: 8, border: false, dark: false })
    expect(readBackgroundContent({ dark: true }).dark).toBe(true)
  })
})
