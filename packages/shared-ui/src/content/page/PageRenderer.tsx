import type { CSSProperties, ReactNode } from 'react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { cssColor } from './color'
import { linkHref } from './linkHref'
import { EditingContext } from './interactiveRenderers'
import { contentFlowOf, renderContent, type ContentFlow } from './contentRenderers'
import { PAGE_BOTTOM_MARGIN, STACK_BELOW, pageHeight, pageScale, readingOrder } from './pageGeometry'
import type { LinkComponent, PageDto, PageElement, SurfaceComponent } from './pageTypes'
import { useContainerWidth } from './useContainerWidth'

const STACK_GAP = 24
const STACK_GUTTER = 16

type Props = {
  page: PageDto
  overlay?: (element: PageElement, scale: number) => ReactNode
  foreground?: (scale: number) => ReactNode
  extraHeight?: number
  editing?: boolean
  stacking?: boolean
}

export function PageRenderer({ page, overlay, foreground, extraHeight = 0, editing = false, stacking = true }: Props) {
  const { ref, width } = useContainerWidth<HTMLDivElement>()
  const stacked = stacking && width > 0 && width < STACK_BELOW

  return (
    <EditingContext.Provider value={editing}>
      <div ref={ref} style={{ ...frameStyle, maxWidth: stacked ? undefined : page.referenceWidth }}>
        {stacked ? (
          <StackedPage page={page} editing={editing} />
        ) : (
          <PlacedPage
            page={page}
            width={width}
            overlay={overlay}
            foreground={foreground}
            extraHeight={extraHeight}
            editing={editing}
          />
        )}
      </div>
    </EditingContext.Provider>
  )
}

type PlacedProps = Required<Pick<Props, 'page' | 'extraHeight' | 'editing'>> &
  Pick<Props, 'overlay' | 'foreground'> & { width: number }

function PlacedPage({ page, width, overlay, foreground, extraHeight, editing }: PlacedProps) {
  const apiUrl = useApiUrl()
  const { referenceWidth, elements } = page
  const scale = pageScale(width, referenceWidth)
  const height = pageHeight(elements) + extraHeight
  const layer = new Map(elements.map((element, index) => [element.id, index + 1]))

  return (
    <div style={{ height: height * scale }}>
      <div style={{ ...canvasStyle, width: referenceWidth, height, transform: `scale(${scale})` }}>
        {readingOrder(elements).map(element => (
          <div key={element.id} style={placedStyle(element, layer.get(element.id) ?? 0)}>
            {wrapInLink(
              element.components.link,
              apiUrl,
              linkFillStyle,
              <div
                style={surfaceStyle(element.components.surface, fillStyle)}
                data-element-surface={editing ? element.id : undefined}
              >
                {renderContent(element.components)}
              </div>,
            )}
            {overlay?.(element, scale)}
          </div>
        ))}
        {foreground && <div style={{ ...foregroundStyle, zIndex: elements.length + 1 }}>{foreground(scale)}</div>}
      </div>
    </div>
  )
}

function StackedPage({ page, editing }: { page: PageDto; editing: boolean }) {
  const apiUrl = useApiUrl()
  const shown = readingOrder(page.elements).flatMap(element => {
    const flow = contentFlowOf(element.components)
    return flow ? [{ element, flow }] : []
  })

  return (
    <div style={stackStyle}>
      {shown.map(({ element, flow }) => (
        <div key={element.id} style={stackedStyle(element, flow)}>
          {wrapInLink(
            element.components.link,
            apiUrl,
            flow === 'text' ? linkFlowStyle : linkFillStyle,
            <div
              style={surfaceStyle(element.components.surface, flow === 'text' ? flowStyle : fillStyle)}
              data-element-surface={editing ? element.id : undefined}
            >
              {renderContent(element.components)}
            </div>,
          )}
        </div>
      ))}
    </div>
  )
}

function placedStyle({ transform: { x, y, w, h } }: PageElement, zIndex: number): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h, zIndex }
}

function stackedStyle({ transform: { w, h } }: PageElement, flow: ContentFlow): CSSProperties {
  return flow === 'text' ? { position: 'relative' } : { position: 'relative', aspectRatio: `${w} / ${h}` }
}

function wrapInLink(link: LinkComponent | undefined, apiUrl: string, style: CSSProperties, children: ReactNode) {
  const href = link ? linkHref(link, apiUrl) : null
  if (!link || !href) return children
  return (
    <a
      href={href}
      target={link.newTab ? '_blank' : undefined}
      rel={link.newTab ? 'noopener noreferrer' : undefined}
      style={style}
    >
      {children}
    </a>
  )
}

function surfaceStyle(surface: SurfaceComponent | undefined, base: CSSProperties): CSSProperties {
  if (!surface) return base
  return {
    ...base,
    backgroundColor: cssColor(surface.background, 'transparent'),
    border:
      surface.borderWidth > 0
        ? `${surface.borderWidth}px solid ${cssColor(surface.borderColor, 'var(--color-border)')}`
        : undefined,
    borderRadius: surface.radius,
  }
}

const linkFillStyle: CSSProperties = { position: 'absolute', inset: 0, display: 'block', color: 'inherit' }
const linkFlowStyle: CSSProperties = { display: 'block', color: 'inherit' }

const fillStyle: CSSProperties = { position: 'absolute', inset: 0, boxSizing: 'border-box', overflow: 'hidden' }
const flowStyle: CSSProperties = { position: 'relative', boxSizing: 'border-box' }

const frameStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  margin: '0 auto',
  overflow: 'hidden',
}

const stackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: STACK_GAP,
  padding: `${STACK_GUTTER}px ${STACK_GUTTER}px ${PAGE_BOTTOM_MARGIN}px`,
}

const foregroundStyle: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' }

const canvasStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: 'top left',
}
