import type { Document } from '../../shared/domain/document'

export type OwnerType = 'project' | 'idea'

export type Feature = {
  id: string
  ownerType: OwnerType
  ownerId: string
  number: number
  reference: string
  name: string
  description: string
  documents: Document[]
}

export type FeatureInfo = { name: string; description: string }

export type FeatureDeletionImpact = { tickets: number }
