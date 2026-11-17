import type { ElementTransform } from './pageTypes'

export const PAGE_BOTTOM_MARGIN = 64
export const STACK_BELOW = 1024

type Placed = Readonly<{ transform: ElementTransform }>

function overlapsEnough(a: ElementTransform, b: ElementTransform): boolean {
  const overlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return overlap > Math.min(a.h, b.h) / 2
}

export function readingRows<T extends Placed>(elements: readonly T[]): T[][] {
  const byTop = [...elements].sort((a, b) => a.transform.y - b.transform.y || a.transform.x - b.transform.x)
  const rows: T[][] = []

  for (const element of byTop) {
    const row = rows[rows.length - 1]
    if (row?.some(member => overlapsEnough(member.transform, element.transform))) row.push(element)
    else rows.push([element])
  }

  return rows.map(row => row.sort((a, b) => a.transform.x - b.transform.x || a.transform.y - b.transform.y))
}

export function readingOrder<T extends Placed>(elements: readonly T[]): T[] {
  return readingRows(elements).flat()
}

export function pageHeight(elements: readonly Placed[]): number {
  const bottom = elements.reduce((lowest, { transform }) => Math.max(lowest, transform.y + transform.h), 0)
  return bottom + PAGE_BOTTOM_MARGIN
}

export function pageScale(containerWidth: number, referenceWidth: number): number {
  if (containerWidth <= 0 || referenceWidth <= 0) return 1
  return Math.min(1, containerWidth / referenceWidth)
}
