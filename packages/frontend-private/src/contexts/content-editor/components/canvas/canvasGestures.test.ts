import { describe, expect, it } from 'vitest'
import { collectGuides, drag, resize } from './canvasGestures'

const WIDTH = 1440
const other = { x: 200, y: 400, w: 300, h: 100 }
const guides = collectGuides([other], WIDTH)

describe('collectGuides', () => {
  it('prend les bords et centres des autres Elements et le centre de la Page', () => {
    expect(guides).toEqual({ x: [720, 200, 350, 500], y: [400, 450, 500] })
  })
})

describe('drag', () => {
  const origin = { x: 0, y: 0, w: 100, h: 50 }

  it('colle le bord gauche au bord d’un autre Element à moins de 6 px', () => {
    const { transform, lines } = drag(origin, 505, 900, WIDTH, guides)

    expect(transform.x).toBe(500)
    expect(lines.x).toBe(500)
  })

  it('colle le centre au centre de la Page', () => {
    const { transform, lines } = drag(origin, 667, 900, WIDTH, guides)

    expect(transform.x).toBe(670)
    expect(lines.x).toBe(720)
  })

  it('colle le bas au haut d’un autre Element', () => {
    const { transform, lines } = drag(origin, 900, 347, WIDTH, guides)

    expect(transform.y).toBe(350)
    expect(lines.y).toBe(400)
  })

  it('suit le pas de 8 px quand aucun repère n’est assez proche', () => {
    const { transform, lines } = drag(origin, 1013, 1013, WIDTH, guides)

    expect(transform).toMatchObject({ x: 1016, y: 1016 })
    expect(lines).toEqual({ x: null, y: null })
  })

  it('laisse le pixel libre sans repères', () => {
    const { transform, lines } = drag(origin, 505, 13, WIDTH, null)

    expect(transform).toMatchObject({ x: 505, y: 13 })
    expect(lines).toEqual({ x: null, y: null })
  })

  it('reste dans la largeur de référence et masque le repère que la borne a fait perdre', () => {
    const { transform, lines } = drag({ x: 0, y: 0, w: 1000, h: 50 }, 498, 0, WIDTH, guides)

    expect(transform.x).toBe(440)
    expect(lines.x).toBeNull()
  })
})

describe('resize', () => {
  const origin = { x: 0, y: 0, w: 100, h: 100 }

  it('colle le bord tiré, pas les autres', () => {
    const { transform, lines } = resize(origin, { dx: 1, dy: 0 }, 103, 0, WIDTH, guides)

    expect(transform).toEqual({ x: 0, y: 0, w: 200, h: 100 })
    expect(lines.x).toBe(200)
  })

  it('suit le pas de 8 px sur le bord tiré', () => {
    const { transform } = resize(origin, { dx: 0, dy: 1 }, 0, 13, WIDTH, guides)

    expect(transform.h).toBe(112)
  })

  it('garde le bord opposé en place en tirant par la gauche', () => {
    const { transform } = resize({ x: 600, y: 0, w: 100, h: 100 }, { dx: -1, dy: 0 }, -97, 0, WIDTH, guides)

    expect(transform).toEqual({ x: 500, y: 0, w: 200, h: 100 })
  })

  it('ne retourne jamais une boîte vide', () => {
    const { transform } = resize(origin, { dx: 1, dy: 1 }, -500, -500, WIDTH, null)

    expect(transform).toEqual({ x: 0, y: 0, w: 1, h: 1 })
  })
})
