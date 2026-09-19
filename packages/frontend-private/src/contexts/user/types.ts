import type { Role } from '../../shared/domain/role'

export type User = {
  id: string
  name: string
  surname: string
  email: string
  roles: Role[]
}
