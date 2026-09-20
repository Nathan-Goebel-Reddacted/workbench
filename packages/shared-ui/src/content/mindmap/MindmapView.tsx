// Rendu en lecture seule d'un mindmap, en SVG pur. Aucune dépendance à React Flow :
// ce composant part dans le bundle du site public, l'éditeur reste côté privé.
//
// Le composant accepte soit un mindmap déjà chargé (`mindmap`), soit une URL de fichier
// `.mindmap.json` qu'il va chercher lui-même (`url`) — c'est cette seconde forme qu'utilise
// le widget document, qui ne connaît qu'une URL.
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MINDMAP_COLORS,
  MINDMAP_FONT_SIZE,
  emptyMindmap,
  nodeFontSize,
  nodeHeight,
  nodeWidth,
  readMindmap,
  type Mindmap,
  type MindmapColor,
  type MindmapEdge,
  type MindmapNode,
} from './mindmap'
import { mindmapFill, mindmapStroke, mindmapText } from './mindmapTheme'
import { resolveUploadUrl } from './documentKind'
import { useElementSize } from '@-reddacted-/react-hooks'

type Props = {
  url?: string
  mindmap?: Mindmap
  // Marge autour du contenu, en unités du repère du mindmap.
  padding?: number
  // Le déplacement au glisser entre en conflit avec le drag dnd-kit de l'éditeur de
  // grille : là-bas seule la molette pilote le cadrage.
  pannable?: boolean
  // Origine de l'API, pour les documents enregistrés avec une URL relative.
  apiUrl?: string
}

type ViewBox = { x: number; y: number; width: number; height: number }

// En dessous d'environ 11 px à l'écran le texte n'est plus lisible : MIN_SCALE est le
// plancher du cadrage initial, calculé sur la taille de police par défaut. L'utilisateur
// reste libre de dézoomer au-delà pour embrasser tout le plan.
const MIN_FONT_PX = 11
const MIN_SCALE = MIN_FONT_PX / MINDMAP_FONT_SIZE

// Étiquette d'arête : taille fixe, elle nomme la relation sans concurrencer les nœuds.
const EDGE_LABEL_SIZE = 12

const ZOOM_STEP = 1.15
const MIN_ZOOM = 0.1
const MAX_ZOOM = 4

export function MindmapView({ url, mindmap, padding = 24, pannable = true, apiUrl }: Props) {
  const [loaded, setLoaded] = useState<Mindmap | null>(mindmap ?? null)
  const [failed, setFailed] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const size = useElementSize(container)
  const [view, setView] = useState<ViewBox | null>(null)
  const panOrigin = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (mindmap) {
      setLoaded(mindmap)
      return
    }
    if (!url) {
      setLoaded(null)
      return
    }

    // Une URL qui change pendant le vol ne doit pas laisser la réponse périmée gagner.
    let cancelled = false
    setFailed(false)

    fetch(resolveUploadUrl(url, apiUrl))
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then(json => {
        if (!cancelled) setLoaded(readMindmap(json))
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setLoaded(emptyMindmap())
        }
      })

    return () => {
      cancelled = true
    }
  }, [url, mindmap, apiUrl])

  const box = useMemo(
    () => (loaded && loaded.nodes.length > 0 ? boundingBox(loaded, padding) : null),
    [loaded, padding],
  )

  // Un nouveau contenu repart d'un cadrage neuf. Un simple redimensionnement, lui, ne
  // doit pas annuler le zoom en cours.
  useEffect(() => {
    setView(null)
  }, [box])

  useEffect(() => {
    if (!box || !size || view) return
    setView(fitView(box, size))
  }, [box, size, view])

  // React pose ses écouteurs `wheel` en passif : sans écouteur propre, impossible
  // d'empêcher la molette de faire défiler la page pendant le zoom.
  useEffect(() => {
    const element = svg.current
    if (!element || !box) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const anchor = clientToUser(element, event.clientX, event.clientY)
      const factor = event.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      setView(state => (state ? zoomAround(state, box, anchor, factor) : state))
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [box])

  if (failed) return <Placeholder label="Mindmap illisible" />
  if (!loaded) return <Placeholder label="Chargement…" />
  if (!box) return <Placeholder label="Mindmap vide" />

  const nodeById = new Map(loaded.nodes.map(node => [node.id, node]))
  const current = view ?? box

  const startPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!pannable || event.button !== 0) return
    // Sans cela, le glisser remonterait au capteur dnd-kit de la grille.
    event.stopPropagation()
    panOrigin.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const pan = (event: React.PointerEvent<SVGSVGElement>) => {
    const origin = panOrigin.current
    if (!origin || !size) return

    const scale = Math.min(size.width / current.width, size.height / current.height)
    panOrigin.current = { x: event.clientX, y: event.clientY }
    setView({
      ...current,
      x: current.x - (event.clientX - origin.x) / scale,
      y: current.y - (event.clientY - origin.y) / scale,
    })
  }

  const endPan = (event: React.PointerEvent<SVGSVGElement>) => {
    panOrigin.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div ref={container} style={containerStyle}>
      <svg
        ref={svg}
        viewBox={`${current.x} ${current.y} ${current.width} ${current.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ ...svgStyle, cursor: pannable ? 'grab' : 'default' }}
        onPointerDown={startPan}
        onPointerMove={pan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onDoubleClick={() => size && setView(fitView(box, size))}
        role="img"
        aria-label="Mindmap"
      >
        <defs>
          {MINDMAP_COLORS.map(color => (
            <marker
              key={color}
              id={arrowId(color)}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={mindmapStroke(color)} />
            </marker>
          ))}
        </defs>

        {/* Les arêtes d'abord : elles doivent passer sous les nœuds. */}
        {loaded.edges.map(edge => {
          const source = nodeById.get(edge.source)
          const target = nodeById.get(edge.target)
          if (!source || !target) return null
          return <Edge key={edge.id} edge={edge} source={source} target={target} />
        })}

        {loaded.nodes.map(node => (
          <Node key={node.id} node={node} />
        ))}
      </svg>
    </div>
  )
}

// Cadrage initial : le contenu entier, sauf s'il faudrait le réduire au point de rendre
// le texte illisible — dans ce cas on cadre au plancher, centré sur le contenu.
function fitView(box: ViewBox, size: { width: number; height: number }): ViewBox {
  const fit = Math.min(size.width / box.width, size.height / box.height)
  if (fit >= MIN_SCALE) return box

  const width = size.width / MIN_SCALE
  const height = size.height / MIN_SCALE
  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  }
}

// Zoom autour d'un point : ce point garde sa position à l'écran pendant la manœuvre.
function zoomAround(view: ViewBox, box: ViewBox, anchor: { x: number; y: number }, factor: number): ViewBox {
  const width = clamp(view.width * factor, box.width / MAX_ZOOM, box.width / MIN_ZOOM)
  const applied = width / view.width

  return {
    x: anchor.x - (anchor.x - view.x) * applied,
    y: anchor.y - (anchor.y - view.y) * applied,
    width,
    height: view.height * applied,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Coordonnées écran → repère du mindmap. La matrice du SVG tient compte du viewBox
// courant et des bandes laissées par preserveAspectRatio.
function clientToUser(element: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const matrix = element.getScreenCTM()
  if (!matrix) return { x: 0, y: 0 }

  const point = element.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const { x, y } = point.matrixTransform(matrix.inverse())
  return { x, y }
}

// Taille du conteneur : le facteur d'échelle du rendu en dépend, et il change avec la
// mise en page (redimensionnement d'une cellule de grille, de la fenêtre…).
function Edge({ edge, source, target }: { edge: MindmapEdge; source: MindmapNode; target: MindmapNode }) {
  const from = centerOf(source)
  const to = centerOf(target)
  const color = edge.color ?? 'default'
  const stroke = mindmapStroke(color)

  return (
    <g>
      <path
        d={edgePath(edge, from, to)}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={edge.stroke === 'dashed' ? '6 4' : undefined}
        markerEnd={edge.arrow === false ? undefined : `url(#${arrowId(color)})`}
      />
      {edge.label && <EdgeLabel label={edge.label} color={color} at={midpointOf(from, to)} />}
    </g>
  )
}

// Le tracé de la v1 était une courbe de Bézier horizontale ; c'est resté le défaut.
function edgePath(edge: MindmapEdge, from: Point, to: Point): string {
  if (edge.path === 'straight') return `M ${from.x} ${from.y} L ${to.x} ${to.y}`

  if (edge.path === 'step') {
    const midX = (from.x + to.x) / 2
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`
  }

  const controlOffset = Math.max(40, Math.abs(to.x - from.x) / 2)
  return `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`
}

// Le texte seul serait barré par le trait qu'il annote : on pose derrière lui un
// rectangle de la couleur du fond. Sa largeur est estimée, SVG ne mesurant pas le texte
// avant le rendu.
function EdgeLabel({ label, color, at }: { label: string; color: MindmapColor; at: Point }) {
  const width = label.length * EDGE_LABEL_SIZE * 0.6 + 8
  const height = EDGE_LABEL_SIZE + 6

  return (
    <g>
      <rect x={at.x - width / 2} y={at.y - height / 2} width={width} height={height} rx={4} fill="var(--color-bg)" />
      <text
        x={at.x}
        y={at.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={mindmapText(color)}
        fontSize={EDGE_LABEL_SIZE}
        fontFamily="inherit"
      >
        {label}
      </text>
    </g>
  )
}

function arrowId(color: MindmapColor): string {
  return `mindmap-arrow-${color}`
}

function Node({ node }: { node: MindmapNode }) {
  const width = nodeWidth(node)
  const height = nodeHeight(node)
  const color = node.color ?? 'default'
  const stroke = mindmapStroke(color)
  const textColor = mindmapText(color)
  const fill = mindmapFill(color, node.fill)
  const fontSize = nodeFontSize(node)

  const shape = (() => {
    if (node.kind === 'shape' && node.shape === 'ellipse') {
      return (
        <ellipse
          cx={node.x + width / 2}
          cy={node.y + height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
        />
      )
    }

    if (node.kind === 'shape' && node.shape === 'arrow') {
      const midY = node.y + height / 2
      return (
        <g transform={`rotate(${node.rotation ?? 0} ${node.x + width / 2} ${midY})`}>
          <line
            x1={node.x}
            y1={midY}
            x2={node.x + width}
            y2={midY}
            stroke={stroke}
            strokeWidth={2}
            markerEnd={`url(#${arrowId(color)})`}
          />
        </g>
      )
    }

    // Nœud d'arborescence, note libre et rectangle partagent la même boîte ; la note
    // libre s'en distingue par un trait discontinu.
    return (
      <rect
        x={node.x}
        y={node.y}
        width={width}
        height={height}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={node.kind === 'free' ? '4 3' : undefined}
      />
    )
  })()

  return (
    <g>
      {shape}
      {node.text && (
        <text
          x={node.x + width / 2}
          y={node.y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontSize={fontSize}
          fontWeight={node.bold ? 700 : 400}
          fontFamily="inherit"
        >
          {truncate(node.text, width, fontSize)}
        </text>
      )}
    </g>
  )
}

// SVG ne sait pas rogner ni renvoyer le texte à la ligne : on coupe à la longueur qui
// tient dans la boîte. Le facteur 0,55 approche la largeur moyenne d'un caractère par
// rapport à sa hauteur — inutile de mesurer finement, la coupe est une sécurité.
function truncate(text: string, width: number, fontSize: number): string {
  const max = Math.max(3, Math.floor((width - 12) / (fontSize * 0.55)))
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

type Point = { x: number; y: number }

function centerOf(node: MindmapNode): Point {
  return { x: node.x + nodeWidth(node) / 2, y: node.y + nodeHeight(node) / 2 }
}

function midpointOf(from: Point, to: Point): Point {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
}

// Le viewBox est calculé à partir du contenu : un mindmap se rend toujours cadré,
// quelle que soit la position absolue de ses nœuds.
function boundingBox(mindmap: Mindmap, padding: number) {
  const xs = mindmap.nodes.map(node => node.x)
  const ys = mindmap.nodes.map(node => node.y)
  const rights = mindmap.nodes.map(node => node.x + nodeWidth(node))
  const bottoms = mindmap.nodes.map(node => node.y + nodeHeight(node))

  const minX = Math.min(...xs) - padding
  const minY = Math.min(...ys) - padding
  const maxX = Math.max(...rights) + padding
  const maxY = Math.max(...bottoms) + padding

  return {
    x: minX,
    y: minY,
    // Un mindmap à un seul nœud ne doit pas produire une largeur nulle.
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  }
}

function Placeholder({ label }: { label: string }) {
  return <div style={placeholderStyle}>{label}</div>
}

const containerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
}

const svgStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  // Sans cela, le geste de déplacement au doigt est confisqué par le défilement.
  touchAction: 'none',
}

const placeholderStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8rem',
  color: 'var(--color-text-muted)',
  backgroundColor: 'var(--color-surface)',
  border: '1px dashed var(--color-border)',
  borderRadius: '6px',
  boxSizing: 'border-box',
}
