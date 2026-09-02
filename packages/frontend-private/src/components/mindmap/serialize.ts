// Traduction entre l'état de React Flow (propre à l'éditeur) et le format de fichier
// partagé défini dans @atelier/content-renderer. C'est le seul endroit qui connaît les
// deux représentations : ni l'éditeur ni le rendu n'ont à savoir comment l'autre stocke.
import type { Edge, Node } from '@xyflow/react'
import {
  MINDMAP_FONT_SIZE,
  MINDMAP_NODE_HEIGHT,
  MINDMAP_NODE_WIDTH,
  MINDMAP_VERSION,
  mindmapStroke,
  type Mindmap,
  type MindmapColor,
  type MindmapEdgePath,
  type MindmapEdgeStroke,
  type MindmapFill,
  type MindmapNode,
  type MindmapNodeKind,
  type MindmapShape,
} from '@atelier/content-renderer'

// Données portées par un nœud dans le graphe React Flow. Le `kind` n'y figure pas :
// c'est le `type` du nœud React Flow, qui décide du composant de rendu.
export type MindmapNodeData = {
  text: string
  color: MindmapColor
  fill: MindmapFill
  fontSize: number
  bold: boolean
  shape?: MindmapShape
  rotation?: number
}

// Les propriétés d'arête vivent dans `data` ; React Flow les traduit en `type`,
// `style`, `label` et `markerEnd` au moment du rendu (voir toFlowEdge).
export type MindmapEdgeData = {
  label: string
  color: MindmapColor
  path: MindmapEdgePath
  stroke: MindmapEdgeStroke
  arrow: boolean
}

export type MindmapFlowNode = Node<MindmapNodeData>
export type MindmapFlowEdge = Edge<MindmapEdgeData>

const KINDS: MindmapNodeKind[] = ['mind', 'free', 'shape']

function kindOf(type: string | undefined): MindmapNodeKind {
  return KINDS.includes(type as MindmapNodeKind) ? (type as MindmapNodeKind) : 'mind'
}

// React Flow expose la taille courante sur le nœud une fois mesuré, mais un nœud
// redimensionné à la main la porte dans son style. Le style prime : c'est la valeur
// voulue par l'utilisateur, la mesure n'en est que le reflet.
function sizeOf(node: MindmapFlowNode): { w: number; h: number } {
  const styleWidth = typeof node.style?.width === 'number' ? node.style.width : undefined
  const styleHeight = typeof node.style?.height === 'number' ? node.style.height : undefined

  return {
    w: styleWidth ?? node.width ?? MINDMAP_NODE_WIDTH,
    h: styleHeight ?? node.height ?? MINDMAP_NODE_HEIGHT,
  }
}

export function toMindmapJson(nodes: MindmapFlowNode[], edges: MindmapFlowEdge[]): Mindmap {
  return {
    version: MINDMAP_VERSION,
    nodes: nodes.map(node => {
      const { w, h } = sizeOf(node)
      const serialized: MindmapNode = {
        id: node.id,
        kind: kindOf(node.type),
        text: node.data.text ?? '',
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        w: Math.round(w),
        h: Math.round(h),
        color: node.data.color ?? 'default',
        fill: node.data.fill ?? 'surface',
        fontSize: node.data.fontSize ?? MINDMAP_FONT_SIZE,
        bold: node.data.bold ?? false,
      }

      if (serialized.kind === 'shape') {
        serialized.shape = node.data.shape ?? 'rectangle'
        serialized.rotation = node.data.rotation ?? 0
      }

      return serialized
    }),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.data?.label ?? '',
      color: edge.data?.color ?? 'default',
      path: edge.data?.path ?? 'bezier',
      stroke: edge.data?.stroke ?? 'solid',
      arrow: edge.data?.arrow !== false,
    })),
  }
}

export function fromMindmapJson(mindmap: Mindmap): { nodes: MindmapFlowNode[]; edges: MindmapFlowEdge[] } {
  return {
    nodes: mindmap.nodes.map(node => ({
      id: node.id,
      type: node.kind,
      position: { x: node.x, y: node.y },
      // La taille repart dans le style, d'où NodeResizer la relit et où elle
      // retournera au prochain enregistrement.
      style: { width: node.w ?? MINDMAP_NODE_WIDTH, height: node.h ?? MINDMAP_NODE_HEIGHT },
      data: {
        text: node.text ?? '',
        color: node.color ?? 'default',
        fill: node.fill ?? 'surface',
        fontSize: node.fontSize ?? MINDMAP_FONT_SIZE,
        bold: node.bold ?? false,
        shape: node.shape,
        rotation: node.rotation,
      },
    })),
    edges: mindmap.edges.map(edge =>
      toFlowEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          label: edge.label ?? '',
          color: edge.color ?? 'default',
          path: edge.path ?? 'bezier',
          stroke: edge.stroke ?? 'solid',
          arrow: edge.arrow !== false,
        },
      }),
    ),
  }
}

// Les champs de `data` sont la source de vérité ; les attributs React Flow qu'ils
// pilotent (type de tracé, trait, étiquette, marqueur) en sont dérivés. Toute mutation
// d'arête doit repasser par ici, sinon le canevas et le fichier divergent.
const PATH_TO_FLOW_TYPE: Record<MindmapEdgePath, string> = {
  bezier: 'default',
  straight: 'straight',
  step: 'step',
}

export function toFlowEdge(edge: MindmapFlowEdge): MindmapFlowEdge {
  const data = edge.data ?? defaultEdgeData()
  const color = mindmapStroke(data.color)

  return {
    ...edge,
    data,
    type: PATH_TO_FLOW_TYPE[data.path] ?? 'default',
    label: data.label || undefined,
    style: { stroke: color, strokeWidth: 2, strokeDasharray: data.stroke === 'dashed' ? '6 4' : undefined },
    markerEnd: data.arrow ? ({ type: 'arrowclosed', color } as MindmapFlowEdge['markerEnd']) : undefined,
    labelStyle: { fill: 'var(--color-text)', fontSize: 12 },
    labelBgStyle: { fill: 'var(--color-bg)' },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
  }
}

export function defaultEdgeData(): MindmapEdgeData {
  return { label: '', color: 'default', path: 'bezier', stroke: 'solid', arrow: true }
}
