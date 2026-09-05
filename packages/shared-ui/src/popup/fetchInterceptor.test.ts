import { describe, expect, it, vi } from 'vitest'
import { createErrorRules, createInterceptedFetch } from '@-reddacted-/react-ui'
import { popupMessages } from './messages'

function responseAt(url: string, status: number, body?: unknown): Response {
  const res = new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
  Object.defineProperty(res, 'url', { value: url })
  return res
}

function interceptorOver(outcome: () => Promise<Response>) {
  const onRequestStart = vi.fn()
  const onError = vi.fn()
  const onReport = vi.fn()
  const rules = createErrorRules({ messages: popupMessages })
  const fetchFn = createInterceptedFetch(() => outcome(), { onRequestStart, onError, onReport }, rules)
  return { fetchFn, onRequestStart, onError, onReport }
}

describe('createInterceptedFetch', () => {
  it('signale le départ de chaque requête, même quand elle réussit', async () => {
    const { fetchFn, onRequestStart, onError } = interceptorOver(async () => responseAt('http://api/projects', 200, []))

    await fetchFn('http://api/projects')

    expect(onRequestStart).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
  })

  it('rapporte le message du corps quand le serveur en fournit un', async () => {
    const { fetchFn, onError } = interceptorOver(async () =>
      responseAt('http://api/projects', 500, { message: 'Base indisponible.' }),
    )

    await fetchFn('http://api/projects')

    expect(onError).toHaveBeenCalledWith('Base indisponible.')
  })

  it('retombe sur un libellé générique quand le corps ne dit rien', async () => {
    const { fetchFn, onError } = interceptorOver(async () => responseAt('http://api/projects', 500))

    await fetchFn('http://api/projects')

    expect(onError).toHaveBeenCalledWith('Le serveur a rencontré une erreur.')
  })

  it('laisse le corps lisible par l’appelant', async () => {
    const { fetchFn } = interceptorOver(async () => responseAt('http://api/projects', 500, { message: 'Boum.' }))

    const res = await fetchFn('http://api/projects')

    await expect(res.json()).resolves.toEqual({ message: 'Boum.' })
  })

  it('ignore les erreurs de saisie, laissées au formulaire', async () => {
    for (const status of [400, 422]) {
      const { fetchFn, onError } = interceptorOver(async () =>
        responseAt('http://api/projects', status, { message: 'Le nom est requis.' }),
      )

      await fetchFn('http://api/projects')

      expect(onError).not.toHaveBeenCalled()
    }
  })

  it('ignore le 401 de la sonde de session, qui est la réponse normale pour un visiteur', async () => {
    const { fetchFn, onError } = interceptorOver(async () => responseAt('http://api/auth/me', 401))

    await fetchFn('http://api/auth/me')

    expect(onError).not.toHaveBeenCalled()
  })

  it('rapporte un 401 ailleurs que sur la sonde de session', async () => {
    const { fetchFn, onError } = interceptorOver(async () => responseAt('http://api/projects', 401))

    await fetchFn('http://api/projects')

    expect(onError).toHaveBeenCalledWith("Vous n'avez pas les droits pour cette action.")
  })

  it('ignore une requête annulée au démontage', async () => {
    const abort = new DOMException('aborted', 'AbortError')
    const { fetchFn, onError } = interceptorOver(async () => {
      throw abort
    })

    await expect(fetchFn('http://api/projects')).rejects.toBe(abort)
    expect(onError).not.toHaveBeenCalled()
  })

  it('rapporte une panne réseau et relance l’erreur telle quelle', async () => {
    const failure = new TypeError('Failed to fetch')
    const { fetchFn, onError } = interceptorOver(async () => {
      throw failure
    })

    await expect(fetchFn('http://api/projects')).rejects.toBe(failure)
    expect(onError).toHaveBeenCalledWith('Le serveur est injoignable.')
  })

  it('rapporte au journal ce que la popup montre, avec la requête derrière', async () => {
    const { fetchFn, onReport } = interceptorOver(async () => responseAt('http://api/projects', 503))

    await fetchFn('http://api/projects', { method: 'DELETE' })

    expect(onReport).toHaveBeenCalledWith({
      message: 'Le serveur a rencontré une erreur.',
      method: 'DELETE',
      url: 'http://api/projects',
      status: 503,
    })
  })

  it('rapporte un échec réseau avec sa cause et sans statut', async () => {
    const cause = new TypeError('Failed to fetch')
    const { fetchFn, onReport } = interceptorOver(async () => {
      throw cause
    })

    await expect(fetchFn('http://api/projects')).rejects.toThrow(cause)

    expect(onReport).toHaveBeenCalledWith({
      message: 'Le serveur est injoignable.',
      method: 'GET',
      url: 'http://api/projects',
      cause,
    })
  })

  it('lit la méthode portée par un objet Request', async () => {
    const { fetchFn, onReport } = interceptorOver(async () => responseAt('http://api/projects', 500))

    await fetchFn(new Request('http://api/projects', { method: 'PUT' }))

    expect(onReport).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT' }))
  })

  it('ne rapporte rien au journal quand la popup se tait', async () => {
    const ignored = interceptorOver(async () => responseAt('http://api/projects', 422))
    await ignored.fetchFn('http://api/projects')
    expect(ignored.onReport).not.toHaveBeenCalled()

    const probe = interceptorOver(async () => responseAt('http://api/auth/me', 401))
    await probe.fetchFn('http://api/auth/me')
    expect(probe.onReport).not.toHaveBeenCalled()
  })
})
