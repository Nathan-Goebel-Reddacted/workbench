import { describe, expect, it } from 'vitest'
import { PAGE_BOTTOM_MARGIN, pageHeight, pageScale, readingOrder, readingRows } from './pageGeometry'

function at(id: string, x: number, y: number, w = 100, h = 100) {
  return { id, transform: { x, y, w, h } }
}

const ids = (elements: { id: string }[]) => elements.map(e => e.id)

describe('readingRows', () => {
  it('lit de haut en bas puis de gauche à droite', () => {
    const rows = readingRows([at('b', 600, 0), at('c', 0, 300), at('a', 0, 0)])

    expect(rows.map(ids)).toEqual([['a', 'b'], ['c']])
  })

  it('range ensemble deux Elements dont les hauteurs se recouvrent sur plus de la moitié de la plus petite', () => {
    const rows = readingRows([at('a', 0, 0, 100, 200), at('b', 600, 120), at('c', 300, 60)])

    expect(rows.map(ids)).toEqual([['a', 'c', 'b']])
  })

  it('sépare deux Elements qui ne se recouvrent que sur la moitié de la plus petite hauteur, ou moins', () => {
    const rows = readingRows([at('a', 0, 0, 100, 200), at('b', 600, 150)])

    expect(rows.map(ids)).toEqual([['a'], ['b']])
  })

  it('rattache un Element à la rangée dès qu’il recouvre assez l’un de ses membres', () => {
    const rows = readingRows([at('a', 0, 0, 100, 100), at('b', 300, 40, 100, 200), at('c', 600, 160)])

    expect(rows.map(ids)).toEqual([['a', 'b', 'c']])
  })

  it('ouvre une nouvelle rangée pour un Element posé pile sous la rangée en cours', () => {
    const rows = readingRows([at('a', 0, 0, 100, 100), at('b', 0, 100)])

    expect(rows.map(ids)).toEqual([['a'], ['b']])
  })

  it('départage deux Elements au même x par leur hauteur sur la Page', () => {
    const rows = readingRows([at('bas', 0, 40), at('haut', 0, 0)])

    expect(rows.map(ids)).toEqual([['haut', 'bas']])
  })

  it('ne modifie pas la liste reçue, qui porte l’ordre de superposition', () => {
    const elements = [at('b', 600, 0), at('a', 0, 0)]

    readingRows(elements)

    expect(ids(elements)).toEqual(['b', 'a'])
  })

  it('rend une liste vide pour une Page vide', () => {
    expect(readingRows([])).toEqual([])
  })
})

describe('readingOrder', () => {
  it('aplatit les rangées dans l’ordre de lecture', () => {
    expect(ids(readingOrder([at('c', 0, 300), at('b', 600, 0), at('a', 0, 0)]))).toEqual(['a', 'b', 'c'])
  })
})

describe('pageHeight', () => {
  it('s’arrête sous l’Element le plus bas, marge comprise', () => {
    expect(pageHeight([at('a', 0, 0, 100, 100), at('b', 0, 400, 100, 50)])).toBe(450 + PAGE_BOTTOM_MARGIN)
  })

  it('se réduit à la marge pour une Page vide', () => {
    expect(pageHeight([])).toBe(PAGE_BOTTOM_MARGIN)
  })
})

describe('pageScale', () => {
  it('ne grossit jamais au-dessus de la largeur de référence', () => {
    expect(pageScale(1920, 1440)).toBe(1)
  })

  it('réduit proportionnellement en dessous', () => {
    expect(pageScale(1080, 1440)).toBe(0.75)
  })

  it('garde l’échelle 1 tant que le conteneur n’est pas mesuré', () => {
    expect(pageScale(0, 1440)).toBe(1)
  })
})
