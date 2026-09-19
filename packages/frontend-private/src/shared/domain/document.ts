export type Document = { id: string; name: string; url: string }

export type NewDocument = Omit<Document, 'id'>

export type DocumentStore = {
  attach(document: NewDocument): Promise<Document>
  detach(documentId: string): Promise<void>
}

export type MindmapDocumentStore = DocumentStore & {
  createMindmap(name: string, content: unknown): Promise<Document>
}
