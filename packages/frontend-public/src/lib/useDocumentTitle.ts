import { useEffect } from 'react'

const SITE = 'Workbench'

// Le titre est statique dans index.html : sans ça, les quatre pages partagent le même
// libellé dans l'onglet, l'historique et les résultats de recherche.
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE}` : `${SITE} — Portfolio`
  }, [title])
}
