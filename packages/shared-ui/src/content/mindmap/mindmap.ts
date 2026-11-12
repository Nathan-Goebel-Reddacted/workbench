// Format de sérialisation d'un mindmap. Ce fichier est le contrat entre l'éditeur
// (frontend-private, React Flow) et le rendu (MindmapView, SVG pur) : il ne doit
// dépendre d'aucune bibliothèque d'édition, le site public l'embarque.
//
// Un mindmap est persisté comme un document ordinaire : un fichier JSON servi depuis
// /uploads, reconnaissable à son suffixe `.mindmap.json` (voir documentKind.ts).

// Version 2 : les nœuds gagnent remplissage, taille de police et graisse, les arêtes
// gagnent étiquette, tracé, style de trait, flèche et couleur. Tous ces champs sont
// optionnels et leur défaut reproduit le rendu de la version 1 — un fichier v1 se lit
// donc sans conversion, et rien n'a à être réécrit.
export const MINDMAP_VERSION = 2

// - `mind` : nœud d'arborescence, connectable à d'autres par une arête.
// - `free` : note flottante, déplaçable mais jamais reliée.
// - `shape` : forme géométrique décorative, dimensionnée à la main.
export type MindmapNodeKind = 'mind' | 'free' | 'shape'

export type MindmapShape = 'rectangle' | 'ellipse' | 'arrow'

// Jeton de couleur, jamais une valeur : le rendu le résout en CSS var. Les trois
// premiers suivent le thème général, les cinq autres viennent de la palette mindmap
// déclarée dans shared-ui/src/theme/themes.ts.
export type MindmapColor = 'default' | 'primary' | 'muted' | 'red' | 'orange' | 'green' | 'blue' | 'purple'

// Remplissage d'un nœud : rien, la surface neutre (rendu de la v1) ou la variante
// douce de sa propre couleur.
export type MindmapFill = 'none' | 'surface' | 'color'

// Tracé d'une arête. `bezier` est le tracé de la v1.
export type MindmapEdgePath = 'bezier' | 'straight' | 'step'

export type MindmapEdgeStroke = 'solid' | 'dashed'

export type MindmapNode = {
  id: string
  kind: MindmapNodeKind
  text: string
  x: number
  y: number
  w?: number
  h?: number
  color?: MindmapColor
  fill?: MindmapFill
  fontSize?: number
  bold?: boolean
  // Seulement pour kind === 'shape'.
  shape?: MindmapShape
  // Seulement pour kind === 'shape' && shape === 'arrow' : angle en degrés.
  rotation?: number
}

export type MindmapEdge = {
  id: string
  source: string
  target: string
  label?: string
  color?: MindmapColor
  path?: MindmapEdgePath
  stroke?: MindmapEdgeStroke
  arrow?: boolean
}

export type Mindmap = {
  version: number
  nodes: MindmapNode[]
  edges: MindmapEdge[]
}

export const MINDMAP_COLORS: MindmapColor[] = [
  'default',
  'primary',
  'muted',
  'red',
  'orange',
  'green',
  'blue',
  'purple',
]
export const MINDMAP_FILLS: MindmapFill[] = ['none', 'surface', 'color']
export const MINDMAP_EDGE_PATHS: MindmapEdgePath[] = ['bezier', 'straight', 'step']
export const MINDMAP_EDGE_STROKES: MindmapEdgeStroke[] = ['solid', 'dashed']

// Dimensions par défaut d'un nœud, partagées par l'éditeur et le rendu : sans elles,
// un nœud sauvé sans w/h ne serait pas dessiné à la même taille des deux côtés.
export const MINDMAP_NODE_WIDTH = 160
export const MINDMAP_NODE_HEIGHT = 48

// Taille de police, en unités du repère du mindmap.
export const MINDMAP_FONT_SIZE = 14
export const MINDMAP_FONT_MIN = 10
export const MINDMAP_FONT_MAX = 32

export function emptyMindmap(): Mindmap {
  return { version: MINDMAP_VERSION, nodes: [], edges: [] }
}

// Lecture défensive : le JSON vient d'un fichier arbitraire servi par /uploads, il peut
// être tronqué, d'une version future, ou ne pas être un mindmap du tout. On ne jette
// jamais — un mindmap illisible se rend comme un mindmap vide. Les champs apparus en v2
// sont normalisés ici : une valeur absente ou aberrante retombe sur le défaut, si bien
// que le reste du code peut les lire sans se méfier.
export function readMindmap(raw: unknown): Mindmap {
  if (!raw || typeof raw !== 'object') return emptyMindmap()

  const source = raw as Partial<Mindmap>
  const nodes = (Array.isArray(source.nodes) ? source.nodes.filter(isMindmapNode) : []).map(normalizeNode)
  const nodeIds = new Set(nodes.map(node => node.id))

  // Une arête qui pointe un nœud absent produirait un trait vers le néant.
  const edges = (Array.isArray(source.edges) ? source.edges.filter(isMindmapEdge) : [])
    .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map(normalizeEdge)

  return {
    version: typeof source.version === 'number' ? source.version : MINDMAP_VERSION,
    nodes,
    edges,
  }
}

function isMindmapNode(value: unknown): value is MindmapNode {
  if (!value || typeof value !== 'object') return false
  const node = value as Partial<MindmapNode>
  return (
    typeof node.id === 'string' &&
    typeof node.x === 'number' &&
    typeof node.y === 'number' &&
    (node.kind === 'mind' || node.kind === 'free' || node.kind === 'shape')
  )
}

function isMindmapEdge(value: unknown): value is MindmapEdge {
  if (!value || typeof value !== 'object') return false
  const edge = value as Partial<MindmapEdge>
  return typeof edge.id === 'string' && typeof edge.source === 'string' && typeof edge.target === 'string'
}

function normalizeNode(node: MindmapNode): MindmapNode {
  return {
    ...node,
    text: typeof node.text === 'string' ? node.text : '',
    color: oneOf(MINDMAP_COLORS, node.color, 'default'),
    fill: oneOf(MINDMAP_FILLS, node.fill, 'surface'),
    fontSize: clampFontSize(node.fontSize),
    bold: node.bold === true,
  }
}

function normalizeEdge(edge: MindmapEdge): MindmapEdge {
  return {
    ...edge,
    label: typeof edge.label === 'string' ? edge.label : '',
    color: oneOf(MINDMAP_COLORS, edge.color, 'default'),
    path: oneOf(MINDMAP_EDGE_PATHS, edge.path, 'bezier'),
    stroke: oneOf(MINDMAP_EDGE_STROKES, edge.stroke, 'solid'),
    // Défaut à `true` : c'est le rendu de la v1, où toute arête portait un marqueur.
    arrow: edge.arrow !== false,
  }
}

function oneOf<T extends string>(allowed: T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function clampFontSize(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return MINDMAP_FONT_SIZE
  return Math.min(Math.max(Math.round(value), MINDMAP_FONT_MIN), MINDMAP_FONT_MAX)
}

export function nodeWidth(node: MindmapNode): number {
  return node.w ?? MINDMAP_NODE_WIDTH
}

export function nodeHeight(node: MindmapNode): number {
  return node.h ?? MINDMAP_NODE_HEIGHT
}

export function nodeFontSize(node: MindmapNode): number {
  return clampFontSize(node.fontSize)
}
