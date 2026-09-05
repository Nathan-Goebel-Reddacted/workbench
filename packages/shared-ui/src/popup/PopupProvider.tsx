import { useEffect, useState, type ReactNode } from 'react'
import { createInterceptedFetch } from './fetchInterceptor'
import { PopupHost } from './PopupHost'

type InterceptedFetch = typeof fetch & { __popupIntercepted?: true }

export function PopupProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const original = window.fetch as InterceptedFetch
    if (original.__popupIntercepted) return

    const intercepted = createInterceptedFetch(original, {
      onRequestStart: () => setMessages(current => (current.length === 0 ? current : [])),
      onError: message => setMessages(current => (current.includes(message) ? current : [...current, message])),
    }) as InterceptedFetch
    intercepted.__popupIntercepted = true
    window.fetch = intercepted

    return () => {
      window.fetch = original
    }
  }, [])

  return (
    <>
      {children}
      <PopupHost messages={messages} onDismiss={() => setMessages([])} />
    </>
  )
}
