import { createContext, useContext, type ReactNode } from 'react'

// Où joindre le backend est un fait de déploiement, pas une donnée que chaque composant se
// passe de main en main. Fourni une fois au point de composition, lu là où on en a besoin.
const ApiUrlContext = createContext<string | null>(null)

export function ApiUrlProvider({ apiUrl, children }: { apiUrl: string; children: ReactNode }) {
  return <ApiUrlContext.Provider value={apiUrl}>{children}</ApiUrlContext.Provider>
}

// Lève plutôt que de rendre une chaîne vide : un provider oublié produirait sinon des requêtes
// vers des URL relatives, qui échouent loin de la cause.
export function useApiUrl(): string {
  const apiUrl = useContext(ApiUrlContext)
  if (apiUrl === null) throw new Error('useApiUrl must be used within an ApiUrlProvider')
  return apiUrl
}
