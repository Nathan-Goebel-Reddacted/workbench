import { describe, expect, it } from 'vitest'
import { toJournalEntry } from './toJournalEntry'

// Ce qui arrive ici a déjà passé les règles de la popup : il ne reste qu'à traduire en entrée de
// journal, et à retenir le seul cas que le package ne peut pas connaître — le POST du journal.

describe('toJournalEntry', () => {
  it('nomme la requête plutôt que de reprendre le libellé montré au visiteur', () => {
    const entry = toJournalEntry({
      message: 'Le serveur a rencontré une erreur.',
      method: 'POST',
      url: 'http://api/projects',
      status: 500,
    })

    expect(entry).toEqual({
      message: 'HTTP 500 — POST http://api/projects',
      stack: undefined,
      url: 'http://api/projects',
      context: {
        kind: 'fetch',
        method: 'POST',
        status: 500,
        shownToUser: 'Le serveur a rencontré une erreur.',
      },
    })
  })

  it('distingue un échec réseau, qui n’a pas de statut, et garde sa trace', () => {
    const cause = new TypeError('Failed to fetch')

    const entry = toJournalEntry({
      message: 'Le serveur est injoignable.',
      method: 'GET',
      url: 'http://api/projects',
      cause,
    })

    expect(entry?.message).toBe('Requête échouée — GET http://api/projects')
    expect(entry?.stack).toBe(cause.stack)
    expect(entry?.context).toMatchObject({ status: undefined })
  })

  it('ne journalise pas le POST du journal : ce serait une boucle', () => {
    const entry = toJournalEntry({
      message: 'Le serveur a rencontré une erreur.',
      method: 'POST',
      url: 'http://api/error-log',
      status: 500,
    })

    expect(entry).toBeNull()
  })
})
