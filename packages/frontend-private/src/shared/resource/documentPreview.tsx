import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { MindmapView, resolveDocumentKind, type DocumentKind } from '@content'
import { API_URL, uploadUrl } from '../config'

export type PreviewState = { url: string; kind: DocumentKind; x: number; y: number } | null

export function isPreviewable(kind: DocumentKind): boolean {
  return kind === 'image' || kind === 'video' || kind === 'pdf' || kind === 'mindmap'
}

export function previewKind(url: string): DocumentKind {
  return resolveDocumentKind(url)
}

export function previewPositionFrom(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect()
  return { x: rect.right + 12, y: rect.top - 8 }
}

const CLOSE_DELAY_MS = 160

export function usePreview() {
  const [state, setState] = useState<PreviewState>(null)
  const closing = useRef<number | null>(null)

  const keep = () => {
    if (closing.current === null) return
    clearTimeout(closing.current)
    closing.current = null
  }

  const show = (url: string, event: React.MouseEvent) => {
    const kind = previewKind(url)
    if (!isPreviewable(kind)) return

    keep()
    const { x, y } = previewPositionFrom(event.currentTarget as HTMLElement)
    setState({ url, kind, x, y })
  }

  const hide = () => {
    keep()
    closing.current = window.setTimeout(() => setState(null), CLOSE_DELAY_MS)
  }

  const hideNow = () => {
    keep()
    setState(null)
  }

  useEffect(() => {
    const close = () => setState(null)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('scroll', close, true)
      if (closing.current !== null) clearTimeout(closing.current)
    }
  }, [])

  return { state, show, hide, keep, hideNow }
}

type TooltipProps = {
  state: PreviewState
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function PreviewTooltip({ state, onMouseEnter, onMouseLeave }: TooltipProps) {
  if (!state) return null

  const content = (() => {
    const url = uploadUrl(state.url)
    if (state.kind === 'image') return <img src={url} alt="preview" style={previewImgStyle} />
    if (state.kind === 'video')
      return (
        <video controls style={previewVideoStyle}>
          <source src={url} />
        </video>
      )
    if (state.kind === 'pdf') return <iframe src={url} style={previewPdfStyle} title="PDF preview" />
    if (state.kind === 'mindmap')
      return (
        <div style={previewMindmapStyle}>
          <MindmapView url={url} apiUrl={API_URL} />
        </div>
      )
    return null
  })()

  if (!content) return null

  const interactive = state.kind === 'mindmap'

  return (
    <div
      style={{ ...tooltipStyle, top: state.y, left: state.x, pointerEvents: interactive ? 'auto' : 'none' }}
      onMouseEnter={interactive ? onMouseEnter : undefined}
      onMouseLeave={interactive ? onMouseLeave : undefined}
    >
      {content}
    </div>
  )
}

export const previewableLabelStyle: CSSProperties = {
  cursor: 'help',
  textDecoration: 'underline dotted',
  textDecorationColor: 'var(--color-text-muted)',
}

const tooltipStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  padding: '0.5rem',
  boxShadow: '0 8px 24px color-mix(in srgb, var(--color-text) 25%, transparent)',
  maxWidth: '320px',
}
const previewImgStyle: CSSProperties = {
  display: 'block',
  maxWidth: '300px',
  maxHeight: '220px',
  objectFit: 'contain',
  borderRadius: '4px',
}
const previewVideoStyle: CSSProperties = {
  display: 'block',
  width: '300px',
  maxHeight: '220px',
  borderRadius: '4px',
}
const previewPdfStyle: CSSProperties = {
  display: 'block',
  width: '300px',
  height: '220px',
  border: 'none',
  borderRadius: '4px',
}
const previewMindmapStyle: CSSProperties = {
  display: 'block',
  width: '300px',
  height: '220px',
  borderRadius: '4px',
}
