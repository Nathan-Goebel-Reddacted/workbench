// Canevas d'édition d'un mindmap. React Flow fournit le drag, le zoom et les
// connexions ; tout le reste (palette, gestes clavier, panneau de style) est local.
//
// Ce composant ne connaît ni le stockage ni le Document : il reçoit un mindmap et
// remonte le mindmap courant. C'est MindmapModal qui sait d'où il vient et où il va.
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './reactFlowTheme.css'
import { Button } from '@atelier/shared-ui'
import {
  MINDMAP_COLORS,
  MINDMAP_EDGE_PATHS,
  MINDMAP_EDGE_STROKES,
  MINDMAP_FILLS,
  MINDMAP_FONT_MAX,
  MINDMAP_FONT_MIN,
  MINDMAP_FONT_SIZE,
  MINDMAP_NODE_HEIGHT,
  MINDMAP_NODE_WIDTH,
  emptyMindmap,
  mindmapStroke,
  type Mindmap,
  type MindmapColor,
  type MindmapEdgePath,
  type MindmapEdgeStroke,
  type MindmapFill,
  type MindmapShape,
} from '@atelier/content-renderer'
import { MINDMAP_NODE_TYPES, MindmapEditProvider } from './nodes'
import {
  defaultEdgeData,
  fromMindmapJson,
  toFlowEdge,
  toMindmapJson,
  type MindmapEdgeData,
  type MindmapFlowEdge,
  type MindmapFlowNode,
  type MindmapNodeData,
} from './serialize'

type Props = {
  initial?: Mindmap
  onChange: (mindmap: Mindmap) => void
  readOnly?: boolean
}

const COLOR_LABELS: Record<MindmapColor, string> = {
  default: 'Neutre',
  primary: 'Accent',
  muted: 'Estompé',
  red: 'Rouge',
  orange: 'Orange',
  green: 'Vert',
  blue: 'Bleu',
  purple: 'Violet',
}

const FILL_LABELS: Record<MindmapFill, string> = {
  none: 'Aucun',
  surface: 'Neutre',
  color: 'Teinté',
}

const SHAPE_LABELS: Record<MindmapShape, string> = {
  rectangle: 'Rectangle',
  ellipse: 'Ellipse',
  arrow: 'Flèche',
}

const PATH_LABELS: Record<MindmapEdgePath, string> = {
  bezier: 'Courbe',
  straight: 'Droite',
  step: 'Orthogonale',
}

const STROKE_LABELS: Record<MindmapEdgeStroke, string> = {
  solid: 'Plein',
  dashed: 'Pointillé',
}

// Décalages de création au clavier, en unités du repère.
const CHILD_GAP = 60
const SIBLING_GAP = 32

// useReactFlow n'est disponible que sous un ReactFlowProvider : le composant exporté
// n'est donc plus le canevas lui-même.
export function MindmapEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}

function Canvas({ initial, onChange, readOnly = false }: Props) {
  const seed = useMemo(() => fromMindmapJson(initial ?? emptyMindmap()), [initial])

  const [nodes, setNodes, onNodesChange] = useNodesState<MindmapFlowNode>(seed.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindmapFlowEdge>(seed.edges)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])

  const wrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  // Toute modification du graphe remonte immédiatement : la modale n'a pas à
  // interroger l'éditeur au moment d'enregistrer.
  useEffect(() => {
    onChange(toMindmapJson(nodes, edges))
  }, [nodes, edges, onChange])

  const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id))
  const selectedEdges = edges.filter(edge => selectedEdgeIds.includes(edge.id))

  const onConnect = useCallback(
    (connection: Connection) => {
      // Une note libre ne porte pas de Handle, donc ne peut pas être connectée ;
      // React Flow ne proposera jamais la connexion. Rien à filtrer ici.
      setEdges(current =>
        addEdge(toFlowEdge({ ...connection, id: crypto.randomUUID(), data: defaultEdgeData() }), current),
      )
    },
    [setEdges],
  )

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodeIds(params.nodes.map(node => node.id))
    setSelectedEdgeIds(params.edges.map(edge => edge.id))
  }, [])

  const setText = useCallback(
    (id: string, text: string) => {
      setNodes(current => current.map(node => (node.id === id ? { ...node, data: { ...node.data, text } } : node)))
    },
    [setNodes],
  )

  const editApi = useMemo(() => ({ setText }), [setText])

  // Le centre de la vue courante, pour qu'un nœud créé apparaisse toujours sous les
  // yeux — la cascade précédente finissait hors écran.
  const viewportCenter = useCallback(() => {
    const rect = wrapper.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }

    const center = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    return { x: Math.round(center.x - MINDMAP_NODE_WIDTH / 2), y: Math.round(center.y - MINDMAP_NODE_HEIGHT / 2) }
  }, [screenToFlowPosition])

  const makeNode = useCallback(
    (type: 'mind' | 'free' | 'shape', position: { x: number; y: number }, shape?: MindmapShape): MindmapFlowNode => ({
      id: crypto.randomUUID(),
      type,
      position,
      style: { width: MINDMAP_NODE_WIDTH, height: MINDMAP_NODE_HEIGHT },
      data: {
        text: '',
        color: 'default',
        fill: 'surface',
        fontSize: MINDMAP_FONT_SIZE,
        bold: false,
        ...(type === 'shape' ? { shape: shape ?? 'rectangle', rotation: 0 } : {}),
      },
    }),
    [],
  )

  const addNode = useCallback(
    (type: 'mind' | 'free' | 'shape', shape?: MindmapShape) => {
      setNodes(current => [...current, makeNode(type, viewportCenter(), shape)])
    },
    [makeNode, setNodes, viewportCenter],
  )

  const updateNodes = useCallback(
    (patch: Partial<MindmapNodeData>) => {
      setNodes(current =>
        current.map(node => (selectedNodeIds.includes(node.id) ? { ...node, data: { ...node.data, ...patch } } : node)),
      )
    },
    [selectedNodeIds, setNodes],
  )

  // Une arête se modifie toujours par son `data`, puis retraverse toFlowEdge : c'est
  // lui qui dérive le tracé, le trait et le marqueur affichés par React Flow.
  const updateEdges = useCallback(
    (patch: Partial<MindmapEdgeData>) => {
      setEdges(current =>
        current.map(edge =>
          selectedEdgeIds.includes(edge.id)
            ? toFlowEdge({ ...edge, data: { ...(edge.data ?? defaultEdgeData()), ...patch } })
            : edge,
        ),
      )
    },
    [selectedEdgeIds, setEdges],
  )

  const removeSelection = useCallback(() => {
    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return

    setNodes(current => current.filter(node => !selectedNodeIds.includes(node.id)))
    // Les arêtes orphelines doivent partir avec leur nœud, sinon la relecture les
    // filtrerait silencieusement au prochain chargement.
    setEdges(current =>
      current.filter(
        edge =>
          !selectedEdgeIds.includes(edge.id) &&
          !selectedNodeIds.includes(edge.source) &&
          !selectedNodeIds.includes(edge.target),
      ),
    )
    setSelectedNodeIds([])
    setSelectedEdgeIds([])
  }, [selectedEdgeIds, selectedNodeIds, setEdges, setNodes])

  const duplicateSelection = useCallback(() => {
    if (selectedNodeIds.length === 0) return

    setNodes(current => {
      const copies = current
        .filter(node => selectedNodeIds.includes(node.id))
        .map(node => ({
          ...node,
          id: crypto.randomUUID(),
          position: { x: node.position.x + 24, y: node.position.y + 24 },
          selected: false,
          data: { ...node.data },
        }))
      return [...current, ...copies]
    })
  }, [selectedNodeIds, setNodes])

  // Tab et Entrée sont les deux gestes qui font qu'un plan se déroule sans lâcher le
  // clavier : un enfant relié à droite, un frère sous le nœud courant.
  const growFromSelection = useCallback(
    (direction: 'child' | 'sibling') => {
      const anchor = nodes.find(node => node.id === selectedNodeIds[0])
      if (!anchor || anchor.type === 'shape') return

      const width = typeof anchor.style?.width === 'number' ? anchor.style.width : MINDMAP_NODE_WIDTH
      const height = typeof anchor.style?.height === 'number' ? anchor.style.height : MINDMAP_NODE_HEIGHT

      const position =
        direction === 'child'
          ? { x: Math.round(anchor.position.x + width + CHILD_GAP), y: Math.round(anchor.position.y) }
          : { x: Math.round(anchor.position.x), y: Math.round(anchor.position.y + height + SIBLING_GAP) }

      const created = makeNode('mind', position)

      // Un frère se rattache au parent du nœud courant ; s'il n'en a pas, il reste
      // libre plutôt que d'inventer une relation.
      const parentId = direction === 'sibling' ? edges.find(edge => edge.target === anchor.id)?.source : anchor.id

      setNodes(current => [...current.map(node => ({ ...node, selected: false })), { ...created, selected: true }])
      setSelectedNodeIds([created.id])

      if (parentId && anchor.type === 'mind') {
        setEdges(current => [
          ...current,
          toFlowEdge({ id: crypto.randomUUID(), source: parentId, target: created.id, data: defaultEdgeData() }),
        ])
      }
    },
    [edges, makeNode, nodes, selectedNodeIds, setEdges, setNodes],
  )

  useEffect(() => {
    if (readOnly) return

    const onKeyDown = (event: KeyboardEvent) => {
      // Pendant une saisie (texte d'un nœud, champ du panneau), le clavier appartient
      // au champ.
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (!wrapper.current?.contains(document.activeElement) && document.activeElement !== document.body) return

      if (event.key === 'Tab') {
        event.preventDefault()
        growFromSelection('child')
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        growFromSelection('sibling')
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        removeSelection()
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelection()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [duplicateSelection, growFromSelection, readOnly, removeSelection])

  return (
    <div style={layoutStyle}>
      <div ref={wrapper} style={canvasStyle}>
        <MindmapEditProvider value={editApi}>
          <ReactFlow
            // Porte le remappage du thème de la librairie sur les CSS vars de l'atelier
            // (voir reactFlowTheme.css).
            className="atelier-mindmap"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            nodeTypes={MINDMAP_NODE_TYPES}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
            multiSelectionKeyCode="Shift"
            // Les raccourcis sont gérés à la main : laisser React Flow supprimer sur
            // Suppr ferait deux suppressions concurrentes.
            deleteKeyCode={null}
            fitView
            proOptions={{ hideAttribution: false }}
          >
            <Background gap={16} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </MindmapEditProvider>
      </div>

      {!readOnly && (
        <aside style={panelStyle}>
          <p style={panelTitleStyle}>Ajouter</p>
          <div style={buttonRowStyle}>
            <Button variant="secondary" onClick={() => addNode('mind')}>
              Nœud
            </Button>
            <Button variant="secondary" onClick={() => addNode('free')}>
              Note
            </Button>
          </div>
          <div style={buttonRowStyle}>
            {(Object.keys(SHAPE_LABELS) as MindmapShape[]).map(shape => (
              <Button key={shape} variant="ghost" onClick={() => addNode('shape', shape)}>
                {SHAPE_LABELS[shape]}
              </Button>
            ))}
          </div>

          {selectedEdges.length > 0 ? (
            <EdgePanel edges={selectedEdges} update={updateEdges} remove={removeSelection} />
          ) : (
            <NodePanel
              nodes={selectedNodes}
              update={updateNodes}
              remove={removeSelection}
              duplicate={duplicateSelection}
            />
          )}

          <p style={panelTitleStyle}>Raccourcis</p>
          <ul style={shortcutListStyle}>
            <li>
              <kbd style={kbdStyle}>Double-clic</kbd> éditer le texte
            </li>
            <li>
              <kbd style={kbdStyle}>Tab</kbd> nœud enfant relié
            </li>
            <li>
              <kbd style={kbdStyle}>Entrée</kbd> nœud frère
            </li>
            <li>
              <kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>D</kbd> dupliquer
            </li>
            <li>
              <kbd style={kbdStyle}>Suppr</kbd> supprimer
            </li>
            <li>
              <kbd style={kbdStyle}>Maj</kbd> + clic : sélection multiple
            </li>
          </ul>
        </aside>
      )}
    </div>
  )
}

// Valeur commune à toute la sélection, ou `undefined` si elles divergent : un panneau
// qui afficherait la valeur du premier élément mentirait sur les autres.
function common<T>(values: T[]): T | undefined {
  if (values.length === 0) return undefined
  return values.every(value => value === values[0]) ? values[0] : undefined
}

function NodePanel({
  nodes,
  update,
  remove,
  duplicate,
}: {
  nodes: MindmapFlowNode[]
  update: (patch: Partial<MindmapNodeData>) => void
  remove: () => void
  duplicate: () => void
}) {
  if (nodes.length === 0) {
    return (
      <>
        <p style={panelTitleStyle}>Sélection</p>
        <p style={mutedStyle}>Sélectionnez un élément pour l'éditer.</p>
      </>
    )
  }

  const single = nodes.length === 1 ? nodes[0] : null
  const color = common(nodes.map(node => node.data.color))
  const fill = common(nodes.map(node => node.data.fill))
  const fontSize = common(nodes.map(node => node.data.fontSize)) ?? MINDMAP_FONT_SIZE
  const bold = common(nodes.map(node => node.data.bold))
  const isArrow = single?.type === 'shape' && single.data.shape === 'arrow'

  return (
    <>
      <p style={panelTitleStyle}>{nodes.length === 1 ? 'Sélection' : `Sélection — ${nodes.length} éléments`}</p>

      {single && !isArrow && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Texte</span>
          <input
            style={inputStyle}
            value={single.data.text ?? ''}
            onChange={event => update({ text: event.target.value })}
          />
        </label>
      )}

      {isArrow && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Rotation — {single?.data.rotation ?? 0}°</span>
          <input
            type="range"
            min={0}
            max={359}
            value={single?.data.rotation ?? 0}
            onChange={event => update({ rotation: Number(event.target.value) })}
          />
        </label>
      )}

      <div style={fieldStyle}>
        <span style={labelStyle}>Couleur</span>
        <Swatches selected={color} onSelect={value => update({ color: value })} />
      </div>

      <label style={fieldStyle}>
        <span style={labelStyle}>Remplissage</span>
        <select
          style={inputStyle}
          value={fill ?? ''}
          onChange={event => update({ fill: event.target.value as MindmapFill })}
        >
          {fill === undefined && <option value="">—</option>}
          {MINDMAP_FILLS.map(value => (
            <option key={value} value={value}>
              {FILL_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Taille du texte — {fontSize}</span>
        <input
          type="range"
          min={MINDMAP_FONT_MIN}
          max={MINDMAP_FONT_MAX}
          value={fontSize}
          onChange={event => update({ fontSize: Number(event.target.value) })}
        />
      </label>

      <label style={checkboxFieldStyle}>
        <input type="checkbox" checked={bold === true} onChange={event => update({ bold: event.target.checked })} />
        <span style={labelStyle}>Gras</span>
      </label>

      {single?.type === 'shape' && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Forme</span>
          <select
            style={inputStyle}
            value={single.data.shape ?? 'rectangle'}
            onChange={event => update({ shape: event.target.value as MindmapShape })}
          >
            {(Object.keys(SHAPE_LABELS) as MindmapShape[]).map(shape => (
              <option key={shape} value={shape}>
                {SHAPE_LABELS[shape]}
              </option>
            ))}
          </select>
        </label>
      )}

      <div style={buttonRowStyle}>
        <Button variant="ghost" onClick={duplicate}>
          Dupliquer
        </Button>
        <Button variant="ghost" onClick={remove}>
          Supprimer
        </Button>
      </div>
    </>
  )
}

function EdgePanel({
  edges,
  update,
  remove,
}: {
  edges: MindmapFlowEdge[]
  update: (patch: Partial<MindmapEdgeData>) => void
  remove: () => void
}) {
  const data = edges.map(edge => edge.data ?? defaultEdgeData())
  const single = edges.length === 1 ? data[0] : null
  const color = common(data.map(item => item.color))
  const path = common(data.map(item => item.path))
  const stroke = common(data.map(item => item.stroke))
  const arrow = common(data.map(item => item.arrow))

  return (
    <>
      <p style={panelTitleStyle}>{edges.length === 1 ? 'Liaison' : `Liaisons — ${edges.length}`}</p>

      {single && (
        <label style={fieldStyle}>
          <span style={labelStyle}>Étiquette</span>
          <input style={inputStyle} value={single.label} onChange={event => update({ label: event.target.value })} />
        </label>
      )}

      <div style={fieldStyle}>
        <span style={labelStyle}>Couleur</span>
        <Swatches selected={color} onSelect={value => update({ color: value })} />
      </div>

      <label style={fieldStyle}>
        <span style={labelStyle}>Tracé</span>
        <select
          style={inputStyle}
          value={path ?? ''}
          onChange={event => update({ path: event.target.value as MindmapEdgePath })}
        >
          {path === undefined && <option value="">—</option>}
          {MINDMAP_EDGE_PATHS.map(value => (
            <option key={value} value={value}>
              {PATH_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Trait</span>
        <select
          style={inputStyle}
          value={stroke ?? ''}
          onChange={event => update({ stroke: event.target.value as MindmapEdgeStroke })}
        >
          {stroke === undefined && <option value="">—</option>}
          {MINDMAP_EDGE_STROKES.map(value => (
            <option key={value} value={value}>
              {STROKE_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label style={checkboxFieldStyle}>
        <input type="checkbox" checked={arrow === true} onChange={event => update({ arrow: event.target.checked })} />
        <span style={labelStyle}>Flèche</span>
      </label>

      <Button variant="ghost" onClick={remove}>
        Supprimer
      </Button>
    </>
  )
}

// Une pastille par jeton : la couleur se choisit en la voyant, pas en lisant son nom.
function Swatches({
  selected,
  onSelect,
}: {
  selected: MindmapColor | undefined
  onSelect: (color: MindmapColor) => void
}) {
  return (
    <div style={swatchRowStyle}>
      {MINDMAP_COLORS.map(color => (
        <button
          key={color}
          type="button"
          title={COLOR_LABELS[color]}
          aria-label={COLOR_LABELS[color]}
          onClick={() => onSelect(color)}
          style={{
            ...swatchStyle,
            backgroundColor: mindmapStroke(color),
            outline: selected === color ? '2px solid var(--color-text)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

const layoutStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  width: '100%',
  height: '100%',
  minHeight: 0,
}
const canvasStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'var(--color-bg)',
}
const panelStyle: CSSProperties = {
  width: '230px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  overflowY: 'auto',
  paddingRight: '0.25rem',
}
const panelTitleStyle: CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  margin: '0.5rem 0 0',
}
const buttonRowStyle: CSSProperties = { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }
const fieldStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.3rem' }
const checkboxFieldStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.4rem' }
const labelStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
const inputStyle: CSSProperties = {
  padding: '0.4rem 0.6rem',
  fontSize: '0.85rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  outline: 'none',
}
const mutedStyle: CSSProperties = { fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }
const swatchRowStyle: CSSProperties = { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }
const swatchStyle: CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  padding: 0,
}
const shortcutListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.72rem',
  color: 'var(--color-text-muted)',
}
const kbdStyle: CSSProperties = {
  fontFamily: 'inherit',
  fontSize: '0.68rem',
  padding: '0.05rem 0.3rem',
  borderRadius: '4px',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
}
