import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { Button } from '@atelier/shared-ui'
import {
  PageRenderer,
  pageAt,
  pageScale,
  type ElementTransform,
  type PageElement,
  type ScreenSize,
  type ShownSlide,
} from '@content'
import { usePage } from '../hooks/usePage'
import type { PageType } from '../types'
import { ElementFrame } from './canvas/ElementFrame'
import { collectGuides, type GuideLines } from './canvas/canvasGestures'
import { ElementInspector } from './inspector/ElementInspector'
import { ClipProbes } from './canvas/ClipProbes'
import { EDITED_SCREENS, SCREEN_LABELS, layoutWarnings, type ClippedByScreen } from './canvas/screenWarnings'
import { PageAlerts, flaggedElements } from './PageAlerts'

const EDITING_ROOM = 320

const BELOW_MOBILE_PREVIEW = 320

const NOTHING_CLIPPED: ClippedByScreen = { desktop: new Set(), tablet: new Set(), mobile: new Set() }

type Props = { pageType: PageType; pageRef: string }

export function PageEditor({ pageType, pageRef }: Props) {
  const { page, status, revision, canEdit, beginInteraction, ...commands } = usePage(pageType, pageRef)
  const { add, move, hide, regenerate, reorder, duplicate, set, unset, remove } = commands
  const [screen, setScreen] = useState<ScreenSize>('desktop')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewWidth, setPreviewWidth] = useState<number | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [shownSlide, setShownSlide] = useState<ShownSlide | null>(null)
  const [preview, setPreview] = useState<{ id: string; transform: ElementTransform; lines: GuideLines } | null>(null)
  const [clipped, setClipped] = useState<ClippedByScreen>(NOTHING_CLIPPED)
  const scroller = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)

  const onMeasure = useCallback(
    (measured: ScreenSize, ids: ReadonlySet<string>) => setClipped(current => ({ ...current, [measured]: ids })),
    [],
  )

  if (status === 'loading') return <p style={mutedStyle}>Loading page…</p>
  if (status === 'error') return <p style={mutedStyle}>The page could not be loaded.</p>
  if (!page) return <p style={mutedStyle}>This page has not been composed yet.</p>

  const editing = previewWidth === null
  const placed = pageAt(page, screen, true)
  const shown = {
    ...page,
    elements: page.elements.map(element =>
      preview?.id === element.id
        ? {
            ...element,
            layout: { ...element.layout, [screen]: { ...element.layout[screen], transform: preview.transform } },
          }
        : element,
    ),
  }
  const selected = canEdit && editing ? placed.elements.find(element => element.id === selectedId) : undefined
  const flagged = new Set(flaggedElements(page.elements, clipped).map(element => element.id))

  const chooseScreen = (next: ScreenSize) => {
    setScreen(next)
    setPreviewWidth(null)
    setConfirmRegenerate(false)
  }

  const reveal = (elementId: string) => {
    setSelectedId(elementId)
    canvas.current
      ?.querySelector(`[data-element-surface="${elementId}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const visibleTop = () => {
    const top = scroller.current?.getBoundingClientRect().top ?? 0
    const box = canvas.current?.getBoundingClientRect()
    if (!box) return 0
    const scale = pageScale(box.width, placed.referenceWidth)
    return Math.max(0, Math.round((top - box.top) / scale))
  }

  const overlay = (element: PageElement, scale: number) => (
    <ElementFrame
      transform={element.transform}
      scale={scale}
      referenceWidth={placed.referenceWidth}
      selected={element.id === selected?.id}
      flagged={flagged.has(element.id)}
      editable={canEdit}
      onSelect={() => setSelectedId(element.id)}
      guides={() =>
        collectGuides(
          placed.elements.filter(other => other.id !== element.id && !other.hidden).map(other => other.transform),
          placed.referenceWidth,
        )
      }
      onPreview={({ transform, lines }) => setPreview({ id: element.id, transform, lines })}
      onCommit={transform => void move(element.id, screen, transform).finally(() => setPreview(null))}
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
      <ClipProbes page={page} onMeasure={onMeasure} />
      <div ref={scroller} style={scrollerStyle} onPointerDown={() => setSelectedId(null)}>
        <div style={toolbarStyle} onPointerDown={event => event.stopPropagation()}>
          {canEdit && editing && (
            <Button variant="solid" onClick={() => void add(screen, visibleTop())}>
              Add element
            </Button>
          )}
          {canEdit && editing && screen !== 'desktop' && !confirmRegenerate && (
            <Button variant="ghost" onClick={() => setConfirmRegenerate(true)}>
              Regenerate from desktop
            </Button>
          )}
          {confirmRegenerate && (
            <span style={confirmStyle}>
              Overwrite every {screen} placement?
              <Button
                variant="solid"
                onClick={() => {
                  setConfirmRegenerate(false)
                  void regenerate(screen)
                }}
              >
                Overwrite
              </Button>
              <Button variant="ghost" onClick={() => setConfirmRegenerate(false)}>
                Cancel
              </Button>
            </span>
          )}
          <div style={previewBarStyle}>
            <div style={groupStyle} role="group" aria-label="Screen size">
              {EDITED_SCREENS.map(option => (
                <Button
                  key={option}
                  variant={editing && screen === option ? 'outline' : 'ghost'}
                  onClick={() => chooseScreen(option)}
                >
                  {SCREEN_LABELS[option]}
                </Button>
              ))}
            </div>
            <div style={groupStyle} role="group" aria-label="Preview">
              {[...EDITED_SCREENS.map(option => page.screens[option].width), BELOW_MOBILE_PREVIEW].map(width => (
                <Button
                  key={width}
                  variant={previewWidth === width ? 'outline' : 'ghost'}
                  onClick={() => setPreviewWidth(width)}
                >
                  {width}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {previewWidth !== null ? (
          <div style={previewScrollStyle}>
            <div style={{ ...previewFrameStyle, width: previewWidth }}>
              <PageRenderer page={page} editing />
            </div>
          </div>
        ) : (
          <>
            <PageAlerts elements={page.elements} clipped={clipped} onSelect={reveal} />
            {placed.elements.length === 0 && (
              <p style={inviteStyle}>
                {canEdit ? 'This page is empty. Add a first element to start composing it.' : 'This page is empty.'}
              </p>
            )}
            <div ref={canvas} style={{ ...canvasStyle, maxWidth: placed.referenceWidth }}>
              <PageRenderer
                key={`${revision}-${screen}`}
                page={shown}
                overlay={overlay}
                foreground={guideLines}
                editing
                showHidden
                screen={screen}
                extraHeight={canEdit ? EDITING_ROOM : 0}
                shownSlide={shownSlide && shownSlide.elementId === selected?.id ? shownSlide : undefined}
              />
            </div>
          </>
        )}
      </div>
      {selected && (
        <div onPointerDown={event => event.stopPropagation()} style={inspectorSlotStyle}>
          <ElementInspector
            key={`${selected.id}-${screen}`}
            element={selected}
            screen={screen}
            warnings={layoutWarnings(selected, clipped)}
            onHide={hidden => void hide(selected.id, screen, hidden)}
            onSet={(kind, value) => void set(selected.id, kind, value)}
            onUnset={kind => void unset(selected.id, kind)}
            onDelete={() => {
              setSelectedId(null)
              void remove(selected.id)
            }}
            onDuplicate={() => void duplicate(selected.id).then(copy => copy && setSelectedId(copy))}
            onReorder={direction => void reorder(selected.id, direction)}
            beginInteraction={beginInteraction}
            onShowSlide={index => setShownSlide({ elementId: selected.id, index })}
          />
        </div>
      )}
    </div>
  )
}

const groupStyle: CSSProperties = { display: 'flex', gap: '0.25rem' }
const confirmStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
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
const toolbarStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }
const previewBarStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginLeft: 'auto' }
const previewScrollStyle: CSSProperties = { overflowX: 'auto' }
const previewFrameStyle: CSSProperties = {
  margin: '0 auto',
  outline: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg)',
}
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
