import { describe, expect, it } from 'vitest'
import { readTextContent } from './types'

describe('readTextContent', () => {
  it('lit un texte enregistré avant les échelles à la taille normale', () => {
    expect(readTextContent({ html: '<p>a</p>' })).toEqual({ html: '<p>a</p>', scale: 'normal' })
  })

  it('garde l’échelle choisie et retombe sur normal pour une valeur inconnue', () => {
    expect(readTextContent({ html: '', scale: 'display' }).scale).toBe('display')
    expect(readTextContent({ html: '', scale: 'huge' }).scale).toBe('normal')
  })
})
