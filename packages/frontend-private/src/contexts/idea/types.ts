import type { Category } from '../../shared/domain/category'
import type { Document } from '../../shared/domain/document'
import type { Link } from '../../shared/domain/link'

export type IdeaSummary = {
  id: string
  reference: string
  number: number
  name: string
  description: string
  createdAt: string
  category: Category
}

export type Idea = IdeaSummary & {
  links: Link[]
  documents: Document[]
}

export type IdeaInfo = { name: string; description: string; category: Category }
