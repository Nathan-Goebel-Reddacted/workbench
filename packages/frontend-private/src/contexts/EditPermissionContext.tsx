import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@atelier/shared-ui'

const EditPermissionContext = createContext(false)

export function EditPermissionProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const canEdit = !loading && user?.roles.includes('edit') === true
  return <EditPermissionContext.Provider value={canEdit}>{children}</EditPermissionContext.Provider>
}

export function useCanEdit(): boolean {
  return useContext(EditPermissionContext)
}
