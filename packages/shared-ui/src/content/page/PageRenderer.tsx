import type { CSSProperties, ReactNode } from 'react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { cssColor } from './color'
import { linkHref } from './linkHref'
import { EditingContext } from './interactiveRenderers'
import { renderContent } from './contentRenderers'
import { pageHeight, pageScale, readingOrder } from './pageGeometry'
import type { LinkComponent, PageDto, PageElement, SurfaceComponent } from './pageTypes'
import { useContainerWidth } from './useContainerWidth'

type Props = {
  page: PageDto
  overlay?: (element: PageElement, scale: number) => ReactNode
  foreground?: (scale: number) => ReactNode
  extraHeight?: number
  editing?: boolean
}

export function PageRenderer({ page, overlay, foreground, extraHeight = 0, editing = false }: Props) {
  const { ref, width } = useContainerWidth<HTMLDivElement>()
  const apiUrl = useApiUrl()
  const { referenceWidth, elements } = page
  const scale = pageScale(width, referenceWidth)
  const height = pageHeight(elements) + extraHeight
  const layer = new Map(elements.map((element, index) => [element.id, index + 1]))

  return (
    <EditingContext.Provider value={editing}>
      <div ref={ref} style={{ ...frameStyle, maxWidth: referenceWidth, height: height * scale }}>
        <div style={{ ...canvasStyle, width: referenceWidth, height, transform: `scale(${scale})` }}>
          {readingOrder(elements).map(element => (
            <div key={element.id} style={elementStyle(element, layer.get(element.id) ?? 0)}>
              {wrapInLink(
                element.components.link,
                apiUrl,
                <div style={surfaceStyle(element.components.surface)}>{renderContent(element.components)}</div>,
              )}
              {overlay?.(element, scale)}
            </div>
          ))}
          {foreground && <div style={{ ...foregroundStyle, zIndex: elements.length + 1 }}>{foreground(scale)}</div>}
        </div>
      </div>
    </EditingContext.Provider>
  )
}

function elementStyle({ transform: { x, y, w, h } }: PageElement, zIndex: number): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h, zIndex }
}

function wrapInLink(link: LinkComponent | undefined, apiUrl: string, children: ReactNode): ReactNode {
  const href = link ? linkHref(link, apiUrl) : null
  if (!link || !href) return children
  return (
    <a
      href={href}
      target={link.newTab ? '_blank' : undefined}
      rel={link.newTab ? 'noopener noreferrer' : undefined}
      style={linkStyle}
    >
      {children}
    </a>
  )
}

const linkStyle: CSSProperties = { position: 'absolute', inset: 0, display: 'block', color: 'inherit' }

function surfaceStyle(surface: SurfaceComponent | undefined): CSSProperties {
  if (!surface) return surfaceBaseStyle
  return {
    ...surfaceBaseStyle,
    backgroundColor: cssColor(surface.background, 'transparent'),
    border:
      surface.borderWidth > 0
        ? `${surface.borderWidth}px solid ${cssColor(surface.borderColor, 'var(--color-border)')}`
        : undefined,
    borderRadius: surface.radius,
  }
}

const surfaceBaseStyle: CSSProperties = { position: 'absolute', inset: 0, boxSizing: 'border-box', overflow: 'hidden' }

const frameStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  margin: '0 auto',
  overflow: 'hidden',
}

const foregroundStyle: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' }

const canvasStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: 'top left',
}
