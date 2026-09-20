import type { ReactNode } from 'react'
import { PopupProvider as BasePopupProvider } from '@-reddacted-/react-ui'
import { popupMessages } from './messages'
import { PopupMessageProvider } from './PopupMessageProvider'
import { toJournalEntry } from './toJournalEntry'
import { useErrorReporter } from '../errorLog/ErrorReporterProvider'

export function PopupProvider({ children }: { children: ReactNode }) {
  const report = useErrorReporter()

  return (
    <BasePopupProvider
      messages={popupMessages}
      closeLabel="Fermer"
      onReport={failure => {
        const entry = toJournalEntry(failure)
        if (entry) report(entry)
      }}
    >
      <PopupMessageProvider closeLabel="Fermer">{children}</PopupMessageProvider>
    </BasePopupProvider>
  )
}
