import type { PageLayoutDto, PageType } from '@content'

// Le couple (type de page, référence) est le contrat de l'éditeur de contenu : il ne vit que
// dans ce contexte, les pages publiques n'en connaissent que le type. Les deux formes font
// foi côté éditeur — les redéclarer ici les laisserait diverger en silence.
export type { PageType }

export type PageLayout = PageLayoutDto

// Une page dont le layout n'a jamais été composé, ou qui a été vidée, n'est pas une page en
// panne : elle se rabat sur son contenu nu. Les deux cas se valent pour l'affichage.
export function isBlankLayout(layout: PageLayout | null): boolean {
  return !layout || layout.sections.length === 0
}
