import { describe, expect, it } from 'vitest'
import type { PageElementDto, TextComponent } from '@content'
import { clippedOn, layoutWarnings, unreadableOn } from './screenWarnings'

const box = { transform: { x: 0, y: 0, w: 10, h: 10 }, hidden: false }

function textElement(fontSize: TextComponent['fontSize'], hiddenOnMobile = false): PageElementDto {
  return {
    id: 'a',
    layout: { desktop: box, tablet: box, mobile: { ...box, hidden: hiddenOnMobile } },
    components: {
      text: { html: '', font: 'body', fontSize, uppercase: false, letterSpacing: 0, color: null },
    },
  }
}

describe('unreadableOn', () => {
  it('compare la taille réglée de chaque taille d’écran à 11 px', () => {
    expect(unreadableOn(textElement({ desktop: 10, tablet: 11, mobile: 12 }))).toEqual(['desktop'])
    expect(unreadableOn(textElement({ desktop: 13, tablet: 12, mobile: 10 }))).toEqual(['mobile'])
  })

  it('ignore une taille où le Text est masqué', () => {
    expect(unreadableOn(textElement({ desktop: 16, tablet: 15, mobile: 8 }, true))).toEqual([])
  })
})

describe('clippedOn', () => {
  it('liste les tailles où l’Element est coupé, sauf celles où il est masqué', () => {
    const clipped = { desktop: new Set(['a']), tablet: new Set<string>(), mobile: new Set(['a']) }

    expect(clippedOn(textElement({ desktop: 16, tablet: 15, mobile: 14 }), clipped)).toEqual(['desktop', 'mobile'])
    expect(clippedOn(textElement({ desktop: 16, tablet: 15, mobile: 14 }, true), clipped)).toEqual(['desktop'])
  })
})

describe('layoutWarnings', () => {
  it('nomme les tailles touchées', () => {
    const clipped = { desktop: new Set<string>(), tablet: new Set(['a']), mobile: new Set(['a']) }

    expect(layoutWarnings(textElement({ desktop: 16, tablet: 15, mobile: 10 }), clipped)).toEqual([
      'Content cut by its box on tablet, mobile: enlarge the element there.',
      'Text below 11 px on mobile: raise its mobile size.',
    ])
  })
})
