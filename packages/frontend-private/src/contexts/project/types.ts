import type { Category } from '../../shared/domain/category'
import type { Document } from '../../shared/domain/document'
import type { Link } from '../../shared/domain/link'

export type ProjectSummary = {
  id: string
  name: string
  description: string
  visible: boolean
  category: Category
}

export type Project = ProjectSummary & {
  number: number
  reference: string
  links: Link[]
  documents: Document[]
}

export type ProjectInfo = { name: string; description: string; category: Category }
