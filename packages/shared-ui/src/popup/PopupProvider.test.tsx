// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { ApiUrlProvider } from '../config/ApiUrlContext'
import { ErrorReporterProvider } from '../errorLog/ErrorReporterProvider'
import { ERROR_LOG_PATH } from '../errorLog/errorReporter'
import { PopupProvider } from './PopupProvider'
import { useShowPopup } from './useShowPopup'

const API = 'http://api'

function stubServer() {
  const server = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    return new Response(null, { status: url.includes(ERROR_LOG_PATH) ? 204 : 500 })
  })
  vi.stubGlobal('fetch', server)
  return server
}

function renderApp(children: React.ReactNode = null) {
  return render(
    <ApiUrlProvider apiUrl={API}>
      <ErrorReporterProvider>
        <PopupProvider>{children}</PopupProvider>
      </ErrorReporterProvider>
    </ApiUrlProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('PopupProvider', () => {
  it('affiche une popup et journalise quand une requête échoue', async () => {
    const server = stubServer()
    renderApp()

    await act(async () => {
      await window.fetch(`${API}/projects`)
    })

    expect(await screen.findByText('Le serveur a rencontré une erreur.')).toBeTruthy()
    expect(server).toHaveBeenCalledWith(`${API}${ERROR_LOG_PATH}`, expect.objectContaining({ method: 'POST' }))
  })

  it("n'affiche qu'une fois un même message poussé deux fois", async () => {
    stubServer()
    let show: (message: string) => void = () => {}
    function Pusher() {
      show = useShowPopup()
      return null
    }
    renderApp(<Pusher />)

    act(() => {
      show('Projet enregistré.')
      show('Projet enregistré.')
    })

    expect(screen.getAllByText('Projet enregistré.')).toHaveLength(1)
  })
})
