import type { CSSProperties } from 'react'
import { renderContent } from './contentRenderers'
import { pageHeight, pageScale, readingOrder } from './pageGeometry'
import type { PageDto, PageElement } from './pageTypes'
import { useContainerWidth } from './useContainerWidth'

type Props = { page: PageDto }

export function PageRenderer({ page }: Props) {
  const { ref, width } = useContainerWidth<HTMLDivElement>()
  const { referenceWidth, elements } = page
  const scale = pageScale(width, referenceWidth)
  const height = pageHeight(elements)
  const layer = new Map(elements.map((element, index) => [element.id, index + 1]))

  return (
    <div ref={ref} style={{ ...frameStyle, maxWidth: referenceWidth, height: height * scale }}>
      <div style={{ ...canvasStyle, width: referenceWidth, height, transform: `scale(${scale})` }}>
        {readingOrder(elements).map(element => (
          <div key={element.id} style={elementStyle(element, layer.get(element.id) ?? 0)}>
            {renderContent(element.components)}
          </div>
        ))}
      </div>
    </div>
  )
}

function elementStyle({ transform: { x, y, w, h } }: PageElement, zIndex: number): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h, zIndex, overflow: 'hidden' }
}

const frameStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  margin: '0 auto',
  overflow: 'hidden',
}

const canvasStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  transformOrigin: 'top left',
}
