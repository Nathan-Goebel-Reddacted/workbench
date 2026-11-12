import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { PopupHost } from '@-reddacted-/react-ui'

const ShowPopupContext = createContext<((message: string) => void) | null>(null)

export function PopupMessageProvider({ children, closeLabel }: { children: ReactNode; closeLabel: string }) {
  const [messages, setMessages] = useState<string[]>([])

  const showPopup = useCallback((message: string) => {
    setMessages(current => (current.includes(message) ? current : [...current, message]))
  }, [])

  const dismiss = useCallback(() => setMessages([]), [])

  const value = useMemo(() => showPopup, [showPopup])

  return (
    <ShowPopupContext.Provider value={value}>
      {children}
      <PopupHost messages={messages} onDismiss={dismiss} closeLabel={closeLabel} />
    </ShowPopupContext.Provider>
  )
}

export function useShowPopup(): (message: string) => void {
  const showPopup = useContext(ShowPopupContext)
  if (!showPopup) throw new Error('useShowPopup must be used inside a PopupProvider')
  return showPopup
}
