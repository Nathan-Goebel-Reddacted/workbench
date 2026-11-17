import { describe, expect, it } from 'vitest'
import { isClipped } from './useClippedElements'

describe('isClipped', () => {
  const box = { scrollHeight: 100, clientHeight: 100, scrollWidth: 200, clientWidth: 200 }

  it('repère un contenu plus haut ou plus large que sa boîte', () => {
    expect(isClipped({ ...box, scrollHeight: 140 })).toBe(true)
    expect(isClipped({ ...box, scrollWidth: 260 })).toBe(true)
  })

  it('tolère un pixel d’arrondi', () => {
    expect(isClipped(box)).toBe(false)
    expect(isClipped({ ...box, scrollHeight: 101 })).toBe(false)
  })
})
