import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@atelier/shared-ui'
import { hasRole } from '../domain/role'

export const EDIT_ROLE_REQUIRED = 'Edit role required'

type Permissions = { canView: boolean; canEdit: boolean }

const EditPermissionContext = createContext<Permissions>({ canView: false, canEdit: false })

export function EditPermissionProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const permissions: Permissions = {
    canView: !loading && hasRole(user?.roles, 'view'),
    canEdit: !loading && hasRole(user?.roles, 'edit'),
  }
  return <EditPermissionContext.Provider value={permissions}>{children}</EditPermissionContext.Provider>
}

export function useCanView(): boolean {
  return useContext(EditPermissionContext).canView
}

export function useCanEdit(): boolean {
  return useContext(EditPermissionContext).canEdit
}
