import { useEffect, useMemo, useState, type RefObject } from 'react'

const TOLERANCE = 1
const SURFACE = '[data-element-surface]'

export function isClipped(box: {
  scrollHeight: number
  clientHeight: number
  scrollWidth: number
  clientWidth: number
}) {
  return box.scrollHeight - box.clientHeight > TOLERANCE || box.scrollWidth - box.clientWidth > TOLERANCE
}

function measure(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>(SURFACE))
    .filter(isClipped)
    .map(surface => surface.dataset.elementSurface ?? '')
    .filter(id => id !== '')
    .sort()
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}

export function useClippedElements(root: RefObject<HTMLElement | null>, active: boolean): ReadonlySet<string> {
  const [clipped, setClipped] = useState<readonly string[]>([])

  useEffect(() => {
    const node = root.current
    if (!node) return
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = measure(node)
        setClipped(current => (sameIds(current, next) ? current : next))
      })
    }
    const resizes = new ResizeObserver(schedule)
    const observeSurfaces = () => {
      resizes.disconnect()
      node.querySelectorAll<HTMLElement>(`${SURFACE}, ${SURFACE} > *`).forEach(box => resizes.observe(box))
    }
    const mutations = new MutationObserver(() => {
      observeSurfaces()
      schedule()
    })
    mutations.observe(node, { subtree: true, childList: true, characterData: true, attributes: true })
    node.addEventListener('load', schedule, true)
    observeSurfaces()
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      resizes.disconnect()
      mutations.disconnect()
      node.removeEventListener('load', schedule, true)
    }
  }, [root, active])

  return useMemo(() => new Set(clipped), [clipped])
}
