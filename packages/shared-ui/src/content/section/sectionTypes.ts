// Vocabulaire de base d'un layout, partagé par l'édition (palette de widgets côté
// frontend-private) et le rendu (SectionPreview). Le catalogue de widgets lui-même
// reste côté éditeur : le rendu n'a besoin que des types.

export type PageType = 'portfolio' | 'project'
// 'document' remplace les anciens 'image' et 'video' : un seul widget rend tout
// document unitaire (image, vidéo, PDF, mindmap), la forme étant déduite de l'URL
// par resolveDocumentKind. Les layouts déjà en base ont été convertis par migration.
// 'linkArea' : rectangle transparent qui se pose sous les autres widgets et rend sa
// surface cliquable vers une URL externe ou la page d'un projet.
export type SectionType =
  | 'text'
  | 'document'
  | 'code'
  | 'link'
  | 'embed'
  | 'carousel'
  | 'projectCard'
  | 'background'
  | 'contactForm'
  | 'linkArea'
export type SectionContent = Record<string, unknown>
