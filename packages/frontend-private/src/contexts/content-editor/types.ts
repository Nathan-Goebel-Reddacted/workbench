import type { PageDto } from '@content'

export type Page = PageDto

export type MediaItem = { id: string; name: string; url: string }
export type TicketMedia = { ticketId: string; reference: string; title: string; images: MediaItem[] }
export type FeatureMedia = { featureId: string; featureName: string; images: MediaItem[]; tickets: TicketMedia[] }
export type ProjectMedia = { projectId: string; projectName: string; images: MediaItem[]; features: FeatureMedia[] }

export type ReorderDirection = 'forward' | 'backward'

export type MediaKind = 'image' | 'video' | 'mindmap' | 'document'

export type BindableProject = { id: string; name: string }
export type BindableFeature = { id: string; name: string }
export type BindableTicket = { id: string; label: string }
