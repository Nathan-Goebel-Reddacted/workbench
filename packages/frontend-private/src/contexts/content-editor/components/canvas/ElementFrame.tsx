import { useRef, type CSSProperties, type PointerEvent } from 'react'
import type { ElementTransform } from '@content'
import { drag, resize, type GestureResult, type Guides, type Handle as GestureHandle } from './canvasGestures'

type Handle = GestureHandle & { cursor: string }

const HANDLES: Handle[] = [
  { dx: -1, dy: -1, cursor: 'nwse-resize' },
  { dx: 0, dy: -1, cursor: 'ns-resize' },
  { dx: 1, dy: -1, cursor: 'nesw-resize' },
  { dx: 1, dy: 0, cursor: 'ew-resize' },
  { dx: 1, dy: 1, cursor: 'nwse-resize' },
  { dx: 0, dy: 1, cursor: 'ns-resize' },
  { dx: -1, dy: 1, cursor: 'nesw-resize' },
  { dx: -1, dy: 0, cursor: 'ew-resize' },
]

const HANDLE_SIZE = 10

type Gesture = {
  startX: number
  startY: number
  origin: ElementTransform
  handle: Handle | null
  guides: Guides
  end: () => void
}

type Props = {
  transform: ElementTransform
  scale: number
  referenceWidth: number
  selected: boolean
  flagged: boolean
  editable: boolean
  onSelect: () => void
  guides: () => Guides
  onPreview: (result: GestureResult) => void
  onCommit: (transform: ElementTransform) => void
  beginInteraction: () => () => void
}

export function ElementFrame(props: Props) {
  const { transform, scale, selected, flagged, editable, onSelect } = props
  const gesture = useRef<Gesture | null>(null)
  const latest = useRef(transform)

  const start = (event: PointerEvent<HTMLElement>, handle: Handle | null) => {
    if (!editable || event.button !== 0) return
    event.stopPropagation()
    event.preventDefault()
    onSelect()
    event.currentTarget.setPointerCapture(event.pointerId)
    latest.current = transform
    gesture.current = {
      startX: event.clientX,
      startY: event.clientY,
      origin: transform,
      handle,
      guides: props.guides(),
      end: props.beginInteraction(),
    }
  }

  const track = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current
    if (!current) return
    const dx = Math.round((event.clientX - current.startX) / scale)
    const dy = Math.round((event.clientY - current.startY) / scale)
    const guides = event.altKey ? null : current.guides
    const next = current.handle
      ? resize(current.origin, current.handle, dx, dy, props.referenceWidth, guides)
      : drag(current.origin, dx, dy, props.referenceWidth, guides)
    latest.current = next.transform
    props.onPreview(next)
  }

  const finish = () => {
    const current = gesture.current
    if (!current) return
    gesture.current = null
    current.end()
    if (!sameTransform(current.origin, latest.current)) props.onCommit(latest.current)
  }

  const handleSize = HANDLE_SIZE / scale

  return (
    <div
      style={{
        ...frameStyle,
        outline: selected ? `${2 / scale}px solid var(--color-primary)` : `${1 / scale}px dashed var(--color-border)`,
        cursor: editable ? 'move' : 'default',
      }}
      onPointerDown={event => start(event, null)}
      onPointerMove={track}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      {flagged && (
        <span style={badgeStyle(scale)} title="This element needs attention">
          !
        </span>
      )}
      {editable &&
        selected &&
        HANDLES.map(handle => (
          <div
            key={`${handle.dx}${handle.dy}`}
            style={handleStyle(handle, handleSize)}
            onPointerDown={event => start(event, handle)}
            onPointerMove={track}
            onPointerUp={finish}
            onPointerCancel={finish}
          />
        ))}
    </div>
  )
}

function sameTransform(a: ElementTransform, b: ElementTransform): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

function handleStyle({ dx, dy, cursor }: Handle, size: number): CSSProperties {
  return {
    position: 'absolute',
    width: size,
    height: size,
    left: `calc(${(dx + 1) * 50}% - ${size / 2}px)`,
    top: `calc(${(dy + 1) * 50}% - ${size / 2}px)`,
    cursor,
    backgroundColor: 'var(--color-bg)',
    border: `${size / HANDLE_SIZE}px solid var(--color-primary)`,
    borderRadius: '2px',
    touchAction: 'none',
  }
}

function badgeStyle(scale: number): CSSProperties {
  const size = 18 / scale
  return {
    position: 'absolute',
    top: -size / 2,
    right: -size / 2,
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12 / scale,
    fontWeight: 700,
    color: 'var(--color-bg)',
    backgroundColor: 'var(--color-primary)',
    pointerEvents: 'none',
  }
}

const frameStyle: CSSProperties = { position: 'absolute', inset: 0, touchAction: 'none' }
