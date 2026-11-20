import { useEffect, useRef, type CSSProperties } from 'react'
import { PageRenderer, type PageDto, type ScreenSize } from '@content'
import { useClippedElements } from './useClippedElements'
import { EDITED_SCREENS } from './screenWarnings'

type Props = { page: PageDto; onMeasure: (screen: ScreenSize, clipped: ReadonlySet<string>) => void }

export function ClipProbes({ page, onMeasure }: Props) {
  return (
    <div aria-hidden style={probesStyle}>
      {EDITED_SCREENS.map(screen => (
        <ClipProbe key={screen} page={page} screen={screen} onMeasure={onMeasure} />
      ))}
    </div>
  )
}

function ClipProbe({ page, screen, onMeasure }: Props & { screen: ScreenSize }) {
  const root = useRef<HTMLDivElement>(null)
  const clipped = useClippedElements(root, true)
  const report = useRef(onMeasure)
  report.current = onMeasure

  useEffect(() => report.current(screen, clipped), [screen, clipped])

  return (
    <div ref={root} style={{ width: page.screens[screen].width }}>
      <PageRenderer page={page} screen={screen} editing />
    </div>
  )
}

const probesStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: -100000,
  visibility: 'hidden',
  pointerEvents: 'none',
}
