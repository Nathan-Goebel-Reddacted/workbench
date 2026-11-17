import { useRef, useState, type CSSProperties } from 'react'
import { Button } from '@atelier/shared-ui'
import { PageRenderer, pageScale, type ElementTransform, type PageElement } from '@content'
import { usePage } from '../hooks/usePage'
import type { PageType } from '../widgets'
import { ElementFrame } from './canvas/ElementFrame'
import { collectGuides, type GuideLines } from './canvas/canvasGestures'
import { ElementInspector } from './inspector/ElementInspector'

const EDITING_ROOM = 320

type Props = { pageType: PageType; pageRef: string }

export function PageEditor({ pageType, pageRef }: Props) {
  const { page, status, revision, canEdit, beginInteraction, add, move, reorder, duplicate, set, unset, remove } =
    usePage(pageType, pageRef)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ id: string; transform: ElementTransform; lines: GuideLines } | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)

  if (status === 'loading') return <p style={mutedStyle}>Loading page…</p>
  if (status === 'error') return <p style={mutedStyle}>The page could not be loaded.</p>
  if (!page) return <p style={mutedStyle}>This page has not been composed yet.</p>

  const shown = {
    ...page,
    elements: page.elements.map(element =>
      preview?.id === element.id ? { ...element, transform: preview.transform } : element,
    ),
  }
  const selected = canEdit ? page.elements.find(element => element.id === selectedId) : undefined

  const visibleTop = () => {
    const top = scroller.current?.getBoundingClientRect().top ?? 0
    const box = canvas.current?.getBoundingClientRect()
    if (!box) return 0
    const scale = pageScale(box.width, page.referenceWidth)
    return Math.max(0, Math.round((top - box.top) / scale))
  }

  const overlay = (element: PageElement, scale: number) => (
    <ElementFrame
      transform={element.transform}
      scale={scale}
      referenceWidth={page.referenceWidth}
      selected={element.id === selected?.id}
      editable={canEdit}
      onSelect={() => setSelectedId(element.id)}
      guides={() =>
        collectGuides(
          page.elements.filter(other => other.id !== element.id).map(other => other.transform),
          page.referenceWidth,
        )
      }
      onPreview={({ transform, lines }) => setPreview({ id: element.id, transform, lines })}
      onCommit={transform => void move(element.id, transform).finally(() => setPreview(null))}
      beginInteraction={beginInteraction}
    />
  )

  const guideLines = (scale: number) =>
    preview && (
      <>
        {preview.lines.x !== null && <div style={{ ...verticalLineStyle, left: preview.lines.x, width: 1 / scale }} />}
        {preview.lines.y !== null && (
          <div style={{ ...horizontalLineStyle, top: preview.lines.y, height: 1 / scale }} />
        )}
      </>
    )

  return (
    <div style={layoutStyle}>
      <div ref={scroller} style={scrollerStyle} onPointerDown={() => setSelectedId(null)}>
        {canEdit && (
          <div style={toolbarStyle} onPointerDown={event => event.stopPropagation()}>
            <Button variant="primary" onClick={() => void add(visibleTop())}>
              Add element
            </Button>
          </div>
        )}
        {page.elements.length === 0 && (
          <p style={inviteStyle}>
            {canEdit ? 'This page is empty. Add a first element to start composing it.' : 'This page is empty.'}
          </p>
        )}
        <div ref={canvas} style={{ ...canvasStyle, maxWidth: page.referenceWidth }}>
          <PageRenderer
            key={revision}
            page={shown}
            overlay={overlay}
            foreground={guideLines}
            editing
            extraHeight={canEdit ? EDITING_ROOM : 0}
          />
        </div>
      </div>
      {selected && (
        <div onPointerDown={event => event.stopPropagation()} style={inspectorSlotStyle}>
          <ElementInspector
            key={selected.id}
            element={selected}
            onSet={(kind, value) => void set(selected.id, kind, value)}
            onUnset={kind => void unset(selected.id, kind)}
            onDelete={() => {
              setSelectedId(null)
              void remove(selected.id)
            }}
            onDuplicate={() => void duplicate(selected.id).then(copy => copy && setSelectedId(copy))}
            onReorder={direction => void reorder(selected.id, direction)}
            beginInteraction={beginInteraction}
          />
        </div>
      )}
    </div>
  )
}

const layoutStyle: CSSProperties = { flex: 1, minHeight: 0, display: 'flex' }
const scrollerStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  padding: '1rem 2rem 2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  backgroundColor: 'var(--color-bg)',
}
const toolbarStyle: CSSProperties = { display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }
const canvasStyle: CSSProperties = {
  width: '100%',
  margin: '0 auto',
  outline: '1px solid var(--color-border)',
}
const verticalLineStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  backgroundColor: 'var(--color-primary)',
}
const horizontalLineStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  backgroundColor: 'var(--color-primary)',
}
const inspectorSlotStyle: CSSProperties = { display: 'flex', minHeight: 0 }
const inviteStyle: CSSProperties = { margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }
const mutedStyle: CSSProperties = { fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '2rem' }
