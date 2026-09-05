import { useDocumentTitle as useTitle } from '@atelier/shared-ui'

const SITE = 'Workbench'

export function useDocumentTitle(title?: string) {
  useTitle(title, SITE, `${SITE} — Portfolio`)
}
