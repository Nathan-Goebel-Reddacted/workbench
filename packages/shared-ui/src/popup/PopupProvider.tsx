import type { ReactNode } from 'react'
import { PopupProvider as BasePopupProvider } from '@-reddacted-/react-ui'
import { popupMessages } from './messages'

export function PopupProvider({ children }: { children: ReactNode }) {
  return (
    <BasePopupProvider messages={popupMessages} closeLabel="Fermer">
      {children}
    </BasePopupProvider>
  )
}
