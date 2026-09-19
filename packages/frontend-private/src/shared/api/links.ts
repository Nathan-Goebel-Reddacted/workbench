import { send } from './http'
import type { LinkStore } from '../domain/link'

export function linkStore(ownerPath: string): LinkStore {
  return {
    add(link) {
      return send(`${ownerPath}/links`, { method: 'POST', body: link })
    },
    remove(link) {
      return send(`${ownerPath}/links`, { method: 'DELETE', body: link })
    },
  }
}
