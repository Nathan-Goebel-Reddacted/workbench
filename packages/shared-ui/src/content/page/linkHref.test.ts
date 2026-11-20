import { describe, expect, it } from 'vitest'
import { linkHref } from './linkHref'

const API = 'https://api.example.com'
const PROJECT = '11111111-1111-4111-8111-111111111111'

describe('linkHref', () => {
  it('suit la destination résolue d’un projet', () => {
    const base = { url: null, projectId: PROJECT, newTab: false }

    expect(linkHref({ ...base, destination: { kind: 'page', projectId: PROJECT } }, API)).toBe(`/projects/${PROJECT}`)
    expect(linkHref({ ...base, destination: { kind: 'external', url: 'https://x.test/' } }, API)).toBe(
      'https://x.test/',
    )
    expect(linkHref({ ...base, destination: { kind: 'none' } }, API)).toBeNull()
    expect(linkHref(base, API)).toBeNull()
  })

  it('sert un fichier envoyé depuis l’API', () => {
    expect(linkHref({ url: '/uploads/a.pdf', projectId: null, newTab: true }, API)).toBe(`${API}/uploads/a.pdf`)
  })

  it('garde une URL externe ou une page projet telle quelle, et reste inerte sans cible', () => {
    expect(linkHref({ url: 'https://x.test/', projectId: null, newTab: false }, API)).toBe('https://x.test/')
    expect(linkHref({ url: `/projects/${PROJECT}`, projectId: null, newTab: false }, API)).toBe(`/projects/${PROJECT}`)
    expect(linkHref({ url: null, projectId: null, newTab: false }, API)).toBeNull()
  })
})
