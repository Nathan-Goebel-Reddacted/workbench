import type { CSSProperties, ReactNode } from 'react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { cssColor } from './color'
import { linkHref } from './linkHref'
import { EditingContext } from './interactiveRenderers'
import { renderContent } from './contentRenderers'
import { pageHeight, pageScale, readingOrder } from './pageGeometry'
import type { LinkComponent, PageDto, PageElement, ScreenPage, ScreenSize, SurfaceComponent } from './pageTypes'
import { useContainerWidth } from './useContainerWidth'
import { ShownSlideContext } from './mediaRenderers'
import { RenderScreenContext } from './typography'
import { pageAt, screenFor } from './screenPage'

type Props = {
  page: PageDto
  screen?: ScreenSize
  overlay?: (element: PageElement, scale: number) => ReactNode
  foreground?: (scale: number) => ReactNode
  extraHeight?: number
  editing?: boolean
  showHidden?: boolean
  shownSlide?: ShownSlide
}

export type ShownSlide = Readonly<{ elementId: string; index: number }>

export function PageRenderer({
  page,
  screen,
  overlay,
  foreground,
  extraHeight = 0,
  editing = false,
  showHidden = false,
  shownSlide,
}: Props) {
  const { ref, width } = useContainerWidth<HTMLDivElement>()
  const rendered = screen ?? screenFor(width, page.screens)
  const placed = pageAt(page, rendered, showHidden)

  return (
    <EditingContext.Provider value={editing}>
      <RenderScreenContext.Provider value={rendered}>
        <div ref={ref}>
          <div style={{ ...frameStyle, maxWidth: placed.referenceWidth }}>
            {width > 0 && (
              <PlacedPage
                page={placed}
                width={width}
                overlay={overlay}
                foreground={foreground}
                extraHeight={extraHeight}
                editing={editing}
                shownSlide={shownSlide}
              />
            )}
          </div>
        </div>
      </RenderScreenContext.Provider>
    </EditingContext.Provider>
  )
}

type PlacedProps = Required<Pick<Props, 'extraHeight' | 'editing'>> &
  Pick<Props, 'overlay' | 'foreground' | 'shownSlide'> & { page: ScreenPage; width: number }

function PlacedPage({ page, width, overlay, foreground, extraHeight, editing, shownSlide }: PlacedProps) {
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
                style={surfaceStyle(element.components.surface, element.hidden ? ghostStyle : fillStyle)}
                data-element-surface={editing && !element.hidden ? element.id : undefined}
              >
                <ShownSlideContext.Provider value={shownSlide?.elementId === element.id ? shownSlide.index : null}>
                  {renderContent(element.components)}
                </ShownSlideContext.Provider>
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

function placedStyle({ transform: { x, y, w, h } }: PageElement, zIndex: number): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h, zIndex }
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

const fillStyle: CSSProperties = { position: 'absolute', inset: 0, boxSizing: 'border-box', overflow: 'hidden' }

const frameStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  margin: '0 auto',
  overflow: 'hidden',
}

const ghostStyle: CSSProperties = {
  ...fillStyle,
  opacity: 0.35,
  backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 6px, var(--color-border) 6px 8px)',
}

const foregroundStyle: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' }

const canvasStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: 'top left',
}
