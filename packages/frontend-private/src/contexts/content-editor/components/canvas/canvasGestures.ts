import type { ElementTransform } from '@content'

export const SNAP_DISTANCE = 6
export const STEP = 8

export type Handle = { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }
export type Guides = { x: number[]; y: number[] }
export type GuideLines = { x: number | null; y: number | null }
export type GestureResult = { transform: ElementTransform; lines: GuideLines }

const NO_LINES: GuideLines = { x: null, y: null }

export function collectGuides(others: readonly ElementTransform[], referenceWidth: number): Guides {
  return {
    x: [referenceWidth / 2, ...others.flatMap(({ x, w }) => [x, x + w / 2, x + w])],
    y: others.flatMap(({ y, h }) => [y, y + h / 2, y + h]),
  }
}

export function drag(
  origin: ElementTransform,
  dx: number,
  dy: number,
  referenceWidth: number,
  guides: Guides | null,
): GestureResult {
  const { w, h } = origin
  const sx = snapBox(origin.x + dx, w, guides?.x)
  const sy = snapBox(origin.y + dy, h, guides?.y)
  const x = clamp(sx.value, 0, referenceWidth - w)
  const y = Math.max(0, sy.value)
  return {
    transform: { x, y, w, h },
    lines: { x: x === sx.value ? sx.line : null, y: y === sy.value ? sy.line : null },
  }
}

export function resize(
  origin: ElementTransform,
  handle: Handle,
  dx: number,
  dy: number,
  referenceWidth: number,
  guides: Guides | null,
): GestureResult {
  let left = origin.x
  let right = origin.x + origin.w
  let top = origin.y
  let bottom = origin.y + origin.h
  const lines = { ...NO_LINES }

  if (handle.dx !== 0) {
    const moved = snapEdge((handle.dx === 1 ? right : left) + dx, guides?.x)
    if (handle.dx === 1) right = clamp(moved.value, left + 1, referenceWidth)
    else left = clamp(moved.value, 0, right - 1)
    lines.x = (handle.dx === 1 ? right : left) === moved.value ? moved.line : null
  }
  if (handle.dy !== 0) {
    const moved = snapEdge((handle.dy === 1 ? bottom : top) + dy, guides?.y)
    if (handle.dy === 1) bottom = Math.max(moved.value, top + 1)
    else top = clamp(moved.value, 0, bottom - 1)
    lines.y = (handle.dy === 1 ? bottom : top) === moved.value ? moved.line : null
  }

  return { transform: { x: left, y: top, w: right - left, h: bottom - top }, lines }
}

type Snapped = { value: number; line: number | null }

function snapBox(start: number, size: number, guides: number[] | undefined): Snapped {
  if (!guides) return { value: Math.round(start), line: null }
  const hit = nearest([start, start + size / 2, start + size], guides)
  if (!hit) return { value: toStep(start), line: null }
  return { value: Math.round(start + hit.line - hit.point), line: hit.line }
}

function snapEdge(edge: number, guides: number[] | undefined): Snapped {
  if (!guides) return { value: Math.round(edge), line: null }
  const hit = nearest([edge], guides)
  if (!hit) return { value: toStep(edge), line: null }
  return { value: Math.round(hit.line), line: hit.line }
}

function nearest(points: number[], guides: number[]): { point: number; line: number } | null {
  let best: { point: number; line: number; distance: number } | null = null
  for (const point of points) {
    for (const line of guides) {
      const distance = Math.abs(line - point)
      if (distance <= SNAP_DISTANCE && (!best || distance < best.distance)) best = { point, line, distance }
    }
  }
  return best
}

function toStep(value: number): number {
  return Math.round(value / STEP) * STEP
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
