import { useState } from 'react'
import { errorDetailOr } from '../api/errors'
import type { Document, DocumentStore } from '../domain/document'

export function useDocuments(
  store: DocumentStore,
  initialDocuments: Document[],
  onChange?: (documents: Document[]) => void,
) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [error, setError] = useState<string | null>(null)

  const update = (next: Document[]) => {
    setDocuments(next)
    onChange?.(next)
  }

  const add = async (name: string, url: string): Promise<boolean> => {
    setError(null)
    try {
      update([...documents, await store.attach({ name, url })])
      return true
    } catch (err) {
      setError(errorDetailOr(err, 'Could not add.'))
      return false
    }
  }

  const remove = async (documentId: string) => {
    try {
      await store.detach(documentId)
      update(documents.filter(d => d.id !== documentId))
    } catch {
      setError('Could not delete.')
    }
  }

  const append = (document: Document) => update([...documents, document])

  return { documents, error, add, remove, append }
}
