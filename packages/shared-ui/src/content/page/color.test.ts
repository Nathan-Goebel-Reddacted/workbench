import { describe, expect, it } from 'vitest'
import { cssColor } from './color'

describe('cssColor', () => {
  it('traduit une variable du thème avec un repli si elle a disparu', () => {
    expect(cssColor({ theme: '--color-primary' }, 'var(--color-text)')).toBe('var(--color-primary, var(--color-text))')
  })

  it('rend une valeur libre telle quelle', () => {
    expect(cssColor({ hex: '#123456' }, 'transparent')).toBe('#123456')
  })

  it('rend le repli sans couleur', () => {
    expect(cssColor(null, 'transparent')).toBe('transparent')
  })
})
