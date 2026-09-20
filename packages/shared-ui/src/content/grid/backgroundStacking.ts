import type { SectionDto, SectionPosition } from './types'

export const BACKGROUND_TYPE = 'background'
export const LINK_AREA_TYPE = 'linkArea'

// Couches de z-index. Les fonds occupent [0, LINK_AREA_Z[ selon leur profondeur, la zone
// cliquable passe devant tous les fonds mais reste sous les autres widgets — c'est ce qui
// lui laisse les clics de sa surface libre sans voler ceux du contenu posé dessus.
// L'élément déplacé passe au-dessus de tout.
const BACKGROUND_Z_MAX = 500
export const LINK_AREA_Z = 499
export const WIDGET_Z = 500
export const DRAGGING_Z = 1000

function covers(outer: SectionPosition, inner: SectionPosition): boolean {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.w >= inner.x + inner.w &&
    outer.y + outer.h >= inner.y + inner.h
  )
}

function isStrictlyLarger(outer: SectionPosition, inner: SectionPosition): boolean {
  return outer.w * outer.h > inner.w * inner.h
}

// « Posé sur » = contenu géométriquement. Deux fonds de rectangles identiques se
// contiendraient mutuellement : l'ordre de la liste (donc d'ajout) les départage,
// le premier faisant office de parent.
function isParentOf(outer: SectionDto, outerIndex: number, inner: SectionDto, innerIndex: number): boolean {
  if (outer.id === inner.id) return false
  if (!covers(outer, inner)) return false
  return isStrictlyLarger(outer, inner) || outerIndex < innerIndex
}

// Profondeur d'empilement de chaque fond : le nombre de fonds qui le contiennent.
// Les sections qui ne sont pas des fonds n'apparaissent pas dans la map.
export function computeBackgroundDepths(sections: SectionDto[]): Map<string, number> {
  const backgrounds = sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.type === BACKGROUND_TYPE)

  const depths = new Map<string, number>()
  for (const { section, index } of backgrounds) {
    const depth = backgrounds.filter(other => isParentOf(other.section, other.index, section, index)).length
    depths.set(section.id, depth)
  }
  return depths
}

// La page est un « fond » : le premier niveau prend donc la surface, le suivant
// revient au fond, et ainsi de suite.
export function backgroundColorForDepth(depth: number): string {
  return depth % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)'
}

export function zIndexFor(section: SectionDto, depths: Map<string, number>): number {
  if (section.type === LINK_AREA_TYPE) return LINK_AREA_Z
  const depth = depths.get(section.id)
  if (depth === undefined) return WIDGET_Z
  // Un fond plus profond doit passer devant celui qui le contient, sans jamais
  // atteindre la couche de la zone cliquable.
  return Math.min(depth, BACKGROUND_Z_MAX - 2)
}
