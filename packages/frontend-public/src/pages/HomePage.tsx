import type { CSSProperties } from 'react'
import { LayoutPreview, type PageLayoutDto } from '@atelier/content-renderer'
import { ErrorMessage, LoadingMessage } from '../components/PageStatus'
import { fetchJson, useAsync } from '@atelier/shared-ui'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type PortfolioDto = { id: string }

// La page d'accueil rend le layout composé dans l'Editor : même géométrie et même
// rendu des widgets que la colonne d'aperçu, en mode « public » (voir RenderMode).
export function HomePage() {
  useDocumentTitle()
  const {
    data: layout,
    status,
    retry,
  } = useAsync(async signal => {
    const portfolio = await fetchJson<PortfolioDto>(`${API_URL}/portfolio`, signal)
    if (!portfolio) return null

    const params = new URLSearchParams({ pageType: 'portfolio', pageRef: portfolio.id })
    return fetchJson<PageLayoutDto>(`${API_URL}/page-layouts/by-ref?${params}`, signal)
  })

  if (status === 'loading') return <LoadingMessage />
  if (status === 'error') return <ErrorMessage onRetry={retry} />

  // Portfolio absent, layout jamais créé ou vidé : ce n'est pas une erreur, juste la page nue.
  if (!layout || layout.sections.length === 0) {
    return (
      <div style={messageContainerStyle}>
        <h1 style={titleStyle}>Atelier Portfolio</h1>
      </div>
    )
  }

  return (
    <main style={pageStyle}>
      <LayoutPreview apiUrl={API_URL} sections={layout.sections} mode="public" />
    </main>
  )
}

// Même gabarit que les pages privées (cf. ThemeEditorPage / AdminPage) : la grille est
// bornée et centrée plutôt qu'étalée sur toute la largeur de l'écran. Ce n'est plus qu'un
// choix de mise en page : la hauteur de ligne suit désormais la largeur du conteneur
// (gridGeometry), donc un bloc garde son rapport quelle que soit la largeur de rendu.
const pageStyle: CSSProperties = {
  // flex plutôt que 100vh : la NavBar occupe déjà le haut de #root (flex column),
  // sinon la page dépasserait la fenêtre de la hauteur de la barre.
  flex: 1,
  width: '100%',
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '2rem',
  backgroundColor: 'var(--color-bg)',
}

const messageContainerStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--color-bg)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.5rem',
  color: 'var(--color-text)',
}
