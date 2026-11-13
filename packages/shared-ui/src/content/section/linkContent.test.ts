import { describe, expect, it } from 'vitest'
import { readLinkContent } from './types'

describe('readLinkContent', () => {
  it('lit un lien enregistré avant les styles comme un lien simple ouvert dans un nouvel onglet', () => {
    expect(
      readLinkContent({ externalLinks: [{ url: 'https://github.com', displayText: 'GitHub', logo: '' }] }),
    ).toEqual({
      externalLinks: [{ url: 'https://github.com', displayText: 'GitHub', logo: '', style: 'link', newTab: true }],
    })
  })

  it('garde le style et l’onglet choisis pour chaque lien', () => {
    const { externalLinks } = readLinkContent({
      externalLinks: [
        { url: '/projects', style: 'solid', newTab: false },
        { url: '/cv.pdf', style: 'outline' },
      ],
    })

    expect(externalLinks.map(l => [l.style, l.newTab])).toEqual([
      ['solid', false],
      ['outline', true],
    ])
  })

  it('retombe sur le lien simple pour un style inconnu', () => {
    expect(readLinkContent({ externalLinks: [{ url: '/a', style: 'ghost' }] }).externalLinks[0].style).toBe('link')
  })
})
