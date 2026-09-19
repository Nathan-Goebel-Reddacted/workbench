import { send, sendJson } from './http'
import type { DocumentStore, MindmapDocumentStore } from '../domain/document'

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

export function mindmapDocumentStore(ownerPath: string): MindmapDocumentStore {
  return {
    ...documentStore(ownerPath),
    async createMindmap(name, content) {
      const { id, url } = await sendJson<{ id: string; url: string }>(`${ownerPath}/mindmaps`, {
        method: 'POST',
        body: { name, content },
      })
      return { id, name, url }
    },
  }
}
