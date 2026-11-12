import { describe, expect, it } from 'vitest'
import {
  CELL_RATIO,
  COLS,
  GAP,
  REFERENCE_ROW_HEIGHT,
  REFERENCE_WIDTH,
  colToPercent,
  gridHeightFor,
  growForType,
  rowHeightFor,
  sectionBox,
  widthPercent,
} from './gridGeometry'

// Cette géométrie est partagée par la zone d'édition, l'aperçu et le rendu public : une dérive
// ici ne casse rien à la compilation, elle déforme silencieusement des layouts déjà composés.

describe('rowHeightFor', () => {
  it('rend la hauteur de référence à la largeur de référence', () => {
    expect(rowHeightFor(REFERENCE_WIDTH)).toBeCloseTo(REFERENCE_ROW_HEIGHT)
  })

  it('garde le rapport d’une cellule constant, quelle que soit la largeur', () => {
    for (const width of [320, 700, 1100, 1920]) {
      const cellWidth = width / COLS
      expect(rowHeightFor(width) / cellWidth).toBeCloseTo(CELL_RATIO)
    }
  })

  it('retombe sur la hauteur de référence tant que le conteneur n’est pas mesuré', () => {
    // Premier rendu, avant que le ResizeObserver n'ait rapporté quoi que ce soit.
    expect(rowHeightFor(0)).toBe(REFERENCE_ROW_HEIGHT)
    expect(rowHeightFor(-1)).toBe(REFERENCE_ROW_HEIGHT)
  })
})

describe('gridHeightFor', () => {
  it('compte une gouttière entre chaque ligne, plus une en pied', () => {
    expect(gridHeightFor(1, 80)).toBe(80 + 2 * GAP)
    expect(gridHeightFor(3, 80)).toBe(3 * (80 + GAP) + GAP)
  })

  it('garde de la place pour la gouttière sur une grille vide', () => {
    expect(gridHeightFor(0, 80)).toBe(GAP)
  })
})

describe('colToPercent / widthPercent', () => {
  it('exprime les colonnes en pourcentage et les gouttières en pixels', () => {
    expect(colToPercent(0)).toBe(`calc(0% + ${GAP / 2}px)`)
    expect(colToPercent(COLS)).toBe(`calc(100% + ${GAP / 2}px)`)
    expect(widthPercent(COLS)).toBe(`calc(100% - ${GAP}px)`)
  })

  it('découpe la largeur en douzièmes', () => {
    expect(colToPercent(6)).toBe(`calc(50% + ${GAP / 2}px)`)
    expect(widthPercent(3)).toBe(`calc(25% - ${GAP}px)`)
  })
})

describe('sectionBox', () => {
  const section = { x: 2, y: 1, w: 4, h: 2 }

  it('empile les lignes en tenant compte des gouttières', () => {
    const box = sectionBox(section, 0, 80)
    expect(box.top).toBe(1 * (80 + GAP))
    expect(box.height).toBe(2 * 80 + GAP)
  })

  it('agrandit dans les quatre directions quand grow est positif', () => {
    const grown = sectionBox(section, 4, 80)
    const plain = sectionBox(section, 0, 80)

    expect(grown.top).toBe(plain.top - 4)
    expect(grown.height).toBe(plain.height + 8)
    expect(grown.left).toContain('- 4px')
    expect(grown.width).toContain('+ 8px')
  })

  it('suit la hauteur de ligne qu’on lui passe, pas une constante', () => {
    expect(sectionBox(section, 0, 40).height).toBe(2 * 40 + GAP)
  })
})

describe('growForType', () => {
  // L'égalité OUTSET = GAP / 2 est ce qui met un widget à la même distance du bord d'un fond
  // qu'il soit posé dessus ou à côté : la démonstration est en commentaire dans gridGeometry.
  it('fait déborder les fonds et resserre les widgets', () => {
    expect(growForType('background')).toBe(GAP / 2)
    expect(growForType('linkArea')).toBe(GAP / 2)
    expect(growForType('text')).toBeLessThan(0)
  })

  it('garde un widget à égale distance du bord d’un fond, dedans ou à côté', () => {
    const outset = growForType('background')
    const inset = -growForType('text')

    expect(inset + outset).toBe(GAP - outset + inset)
  })
})
