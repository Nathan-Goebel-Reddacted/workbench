import { send, sendJson } from './http'
import type { DocumentStore } from '../domain/document'

export function documentStore(ownerPath: string): DocumentStore {
  return {
    async attach(document) {
      const { id } = await sendJson<{ id: string }>(`${ownerPath}/documents`, { method: 'POST', body: document })
      return { id, ...document }
    },
    detach(documentId) {
      return send(`${ownerPath}/documents/${documentId}`, { method: 'DELETE' })
    },
  }
}
