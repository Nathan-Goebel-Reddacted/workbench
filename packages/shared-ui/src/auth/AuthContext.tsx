import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type AuthUser = { id: string; email: string; roles: string[] }

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  fetchError: boolean
  logout: () => Promise<void>
  logoutEverywhere: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setUser(null)
        } else if (!res.ok) {
          setFetchError(true)
        } else {
          return res.json().then((data: AuthUser) => setUser(data))
        }
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [])

  // Le cookie de session est httpOnly : seul le serveur peut l'effacer, le navigateur
  // n'y a pas accès. La déconnexion est donc un aller-retour, pas un nettoyage local.
  async function endSession(route: string) {
    try {
      await fetch(`${API_URL}${route}`, { method: 'POST', credentials: 'include' })
    } finally {
      setUser(null)
    }
  }

  const logout = () => endSession('/auth/logout')
  // Fait tomber aussi les sessions ouvertes sur les autres appareils.
  const logoutEverywhere = () => endSession('/auth/logout-everywhere')

  return (
    <AuthContext.Provider value={{ user, loading, fetchError, logout, logoutEverywhere }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
