import type { CSSProperties } from 'react'
import { PublishedPage } from '../contexts/content-editor'
import { usePortfolio } from '../contexts/portfolio'
import { Async } from '../shared/components/PageStatus'
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle'

// L'accueil n'a pas de contexte à lui : il compose la page du portfolio telle que l'éditeur
// de contenu l'a publiée. Le portfolio ne lui sert qu'à savoir laquelle.
export function HomePage() {
  useDocumentTitle()
  const { portfolio, status, retry } = usePortfolio()

  const bare = (
    <div style={messageContainerStyle}>
      <h1 style={titleStyle}>Atelier Portfolio</h1>
    </div>
  )

  return (
    <Async status={status} onRetry={retry}>
      {() => (portfolio ? <PublishedPage pageType="portfolio" pageRef={portfolio.id} blank={bare} /> : bare)}
    </Async>
  )
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
