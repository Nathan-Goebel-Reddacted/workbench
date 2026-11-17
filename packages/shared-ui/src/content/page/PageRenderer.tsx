import type { CSSProperties, ReactNode } from 'react'
import { renderContent } from './contentRenderers'
import { pageHeight, pageScale, readingOrder } from './pageGeometry'
import type { PageDto, PageElement } from './pageTypes'
import { useContainerWidth } from './useContainerWidth'

type Props = {
  page: PageDto
  overlay?: (element: PageElement, scale: number) => ReactNode
  foreground?: (scale: number) => ReactNode
  extraHeight?: number
}

export function PageRenderer({ page, overlay, foreground, extraHeight = 0 }: Props) {
  const { ref, width } = useContainerWidth<HTMLDivElement>()
  const { referenceWidth, elements } = page
  const scale = pageScale(width, referenceWidth)
  const height = pageHeight(elements) + extraHeight
  const layer = new Map(elements.map((element, index) => [element.id, index + 1]))

  return (
    <div ref={ref} style={{ ...frameStyle, maxWidth: referenceWidth, height: height * scale }}>
      <div style={{ ...canvasStyle, width: referenceWidth, height, transform: `scale(${scale})` }}>
        {readingOrder(elements).map(element => (
          <div key={element.id} style={elementStyle(element, layer.get(element.id) ?? 0)}>
            {renderContent(element.components)}
            {overlay?.(element, scale)}
          </div>
        ))}
        {foreground && <div style={{ ...foregroundStyle, zIndex: elements.length + 1 }}>{foreground(scale)}</div>}
      </div>
    </div>
  )
}

function elementStyle({ transform: { x, y, w, h } }: PageElement, zIndex: number): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h, zIndex }
}

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
