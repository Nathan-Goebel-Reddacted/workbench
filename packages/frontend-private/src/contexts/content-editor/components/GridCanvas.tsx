import { useRef, type CSSProperties } from 'react'
import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useCanEdit } from '../../../shared/auth/EditPermissionContext'
import { SectionBlock } from './SectionBlock'
import {
  GAP,
  sectionBox,
  growForType,
  rowHeightFor,
  gridHeightFor,
  useRowHeight,
  DRAGGING_Z,
  computeBackgroundDepths,
  zIndexFor,
  type SectionDto,
  type SectionPosition,
} from '@content'
import type { SectionContent } from '../widgets'

const MIN_W = 1
const MIN_H = 1

type ResizeHandleProps = {
  section: SectionDto
  gridColumns: number
  gridRef: React.RefObject<HTMLDivElement | null>
  onResize: (id: string, position: SectionPosition) => void
}

function ResizeHandle({ section, gridColumns, gridRef, onResize }: ResizeHandleProps) {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startW = section.w
    const startH = section.h
    const gridWidth = gridRef.current?.getBoundingClientRect().width ?? 800
    const colPx = gridWidth / gridColumns
    const rowPx = rowHeightFor(gridWidth) + GAP

    const onPointerMove = (ev: PointerEvent) => {
      const dw = Math.round((ev.clientX - startX) / colPx)
      const dh = Math.round((ev.clientY - startY) / rowPx)
      const newW = Math.max(MIN_W, Math.min(gridColumns - section.x, startW + dw))
      const newH = Math.max(MIN_H, startH + dh)
      onResize(section.id, { x: section.x, y: section.y, w: newW, h: newH })
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'se-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return <div style={resizeHandleStyle} onPointerDown={handlePointerDown} />
}

type DraggableSectionProps = {
  section: SectionDto
  gridColumns: number
  gridRef: React.RefObject<HTMLDivElement | null>
  rowHeight: number
  zIndex: number
  backgroundDepth?: number
  onRemove: (sectionId: string) => void
  onResize: (id: string, position: SectionPosition) => void
  onUpdateContent: (sectionId: string, content: SectionContent) => void
}

function DraggableSection({
  section,
  gridColumns,
  gridRef,
  rowHeight,
  zIndex,
  backgroundDepth,
  onRemove,
  onResize,
  onUpdateContent,
}: DraggableSectionProps) {
  const canEdit = useCanEdit()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: section.id })

  const style: CSSProperties = {
    position: 'absolute',
    ...sectionBox(section, growForType(section.type), rowHeight),
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? DRAGGING_Z : zIndex,
    opacity: isDragging ? 0.85 : 1,
    transition: isDragging ? 'none' : 'transform 200ms ease',
    cursor: canEdit ? (isDragging ? 'grabbing' : 'grab') : 'default',
  }

  return (
    <div ref={setNodeRef} style={style} {...(canEdit ? listeners : undefined)} {...attributes}>
      <SectionBlock
        section={section}
        backgroundDepth={backgroundDepth}
        onRemove={onRemove}
        onUpdateContent={onUpdateContent}
      />
      {canEdit && <ResizeHandle section={section} gridColumns={gridColumns} gridRef={gridRef} onResize={onResize} />}
    </div>
  )
}

type GridCanvasProps = {
  sections: SectionDto[]
  gridColumns: number
  onMoveSection: (sectionId: string, position: SectionPosition) => void
  onRemoveSection: (sectionId: string) => void
  onUpdateContent: (sectionId: string, content: SectionContent) => void
}

export function GridCanvas({
  sections,
  gridColumns,
  onMoveSection,
  onRemoveSection,
  onUpdateContent,
}: GridCanvasProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const rowHeight = useRowHeight(gridRef)
  const maxRow = sections.reduce((max, s) => Math.max(max, s.y + s.h), 4)
  const gridHeight = gridHeightFor(maxRow, rowHeight)
  const depths = computeBackgroundDepths(sections)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    const section = sections.find(s => s.id === active.id)
    if (!section || (!delta.x && !delta.y)) return

    const gridWidth = gridRef.current?.getBoundingClientRect().width ?? 800
    if (gridWidth === 0) return
    const colPx = gridWidth / gridColumns
    const dx = Math.round(delta.x / colPx)
    const dy = Math.round(delta.y / (rowHeightFor(gridWidth) + GAP))

    const newX = Math.max(0, Math.min(gridColumns - section.w, section.x + dx))
    const newY = Math.max(0, section.y + dy)

    onMoveSection(section.id, { x: newX, y: newY, w: section.w, h: section.h })
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        ref={gridRef}
        style={{
          ...canvasStyle,
          minHeight: gridHeight,
          backgroundSize: `calc(100% / ${gridColumns}) ${rowHeight + GAP}px`,
        }}
      >
        {sections.length === 0 && <p style={emptyStyle}>Drag a component here, or click an item in the panel.</p>}
        {sections.map(section => (
          <DraggableSection
            key={section.id}
            section={section}
            gridColumns={gridColumns}
            gridRef={gridRef}
            rowHeight={rowHeight}
            zIndex={zIndexFor(section, depths)}
            backgroundDepth={depths.get(section.id)}
            onRemove={onRemoveSection}
            onResize={onMoveSection}
            onUpdateContent={onUpdateContent}
          />
        ))}
      </div>
    </DndContext>
  )
}

const gridLine = 'color-mix(in srgb, var(--color-border) 55%, transparent)'

const canvasStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  flex: 1,
  backgroundColor: 'var(--color-bg)',
  backgroundImage: `linear-gradient(to right, ${gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)`,
  border: '1px dashed var(--color-border)',
  borderRadius: '8px',
}

const emptyStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  margin: 0,
}

const resizeHandleStyle: CSSProperties = {
  position: 'absolute',
  right: 2,
  bottom: 2,
  width: '14px',
  height: '14px',
  cursor: 'se-resize',
  borderRight: '2px solid var(--color-text-muted)',
  borderBottom: '2px solid var(--color-text-muted)',
  opacity: 0.5,
}
