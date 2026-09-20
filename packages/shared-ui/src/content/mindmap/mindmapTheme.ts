// Résolution des jetons de couleur d'un mindmap en variables CSS. Source unique,
// partagée par le rendu SVG (MindmapView) et par les nœuds de l'éditeur (nodes.tsx) :
// les deux portaient jusqu'ici leurs propres tables, qui pouvaient diverger.
//
// Le format de fichier ne stocke qu'un nom de jeton ; les valeurs vivent dans le thème
// (shared-ui/src/theme/themes.ts), donc un mindmap suit le thème courant.
import type { MindmapColor, MindmapFill } from './mindmap'

// Trait et texte d'un jeton.
export const MINDMAP_STROKE: Record<MindmapColor, string> = {
  default: 'var(--color-border)',
  primary: 'var(--color-primary)',
  muted: 'var(--color-border)',
  red: 'var(--color-mindmap-red)',
  orange: 'var(--color-mindmap-orange)',
  green: 'var(--color-mindmap-green)',
  blue: 'var(--color-mindmap-blue)',
  purple: 'var(--color-mindmap-purple)',
}

export const MINDMAP_TEXT: Record<MindmapColor, string> = {
  default: 'var(--color-text)',
  primary: 'var(--color-primary)',
  muted: 'var(--color-text-muted)',
  red: 'var(--color-mindmap-red)',
  orange: 'var(--color-mindmap-orange)',
  green: 'var(--color-mindmap-green)',
  blue: 'var(--color-mindmap-blue)',
  purple: 'var(--color-mindmap-purple)',
}

// Variante douce, utilisée en remplissage. Les jetons du thème général n'en ont pas
// de propre : ils retombent sur la surface neutre.
const MINDMAP_SOFT: Record<MindmapColor, string> = {
  default: 'var(--color-surface)',
  primary: 'var(--color-primary-soft)',
  muted: 'var(--color-surface)',
  red: 'var(--color-mindmap-red-soft)',
  orange: 'var(--color-mindmap-orange-soft)',
  green: 'var(--color-mindmap-green-soft)',
  blue: 'var(--color-mindmap-blue-soft)',
  purple: 'var(--color-mindmap-purple-soft)',
}

export function mindmapStroke(color: MindmapColor | undefined): string {
  return MINDMAP_STROKE[color ?? 'default'] ?? MINDMAP_STROKE.default
}

export function mindmapText(color: MindmapColor | undefined): string {
  return MINDMAP_TEXT[color ?? 'default'] ?? MINDMAP_TEXT.default
}

// `none` doit rester transparent et non « couleur du fond » : un nœud posé sur un
// autre laisse voir ce qu'il y a dessous.
export function mindmapFill(color: MindmapColor | undefined, fill: MindmapFill | undefined): string {
  if (fill === 'none') return 'transparent'
  if (fill === 'color') return MINDMAP_SOFT[color ?? 'default'] ?? MINDMAP_SOFT.default
  return 'var(--color-surface)'
}
