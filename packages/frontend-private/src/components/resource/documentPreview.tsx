// Aperçu au survol d'un document, partagé par DocumentsSection et FeaturesSection.
// Les deux écrans portaient jusqu'ici deux copies de la même logique, avec des listes
// d'extensions déjà divergentes ; un nouveau format n'aurait été reconnu que d'un côté.
//
// La reconnaissance est déléguée à resolveDocumentKind (@atelier/content-renderer),
// la même que celle du widget document et du rendu public.
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { MindmapView, resolveDocumentKind, resolveUploadUrl, type DocumentKind } from '@atelier/content-renderer'

export type PreviewState = { url: string; kind: DocumentKind; x: number; y: number } | null

// Les formes qui n'ont rien à montrer au survol ne déclenchent pas d'infobulle.
export function isPreviewable(kind: DocumentKind): boolean {
  return kind === 'image' || kind === 'video' || kind === 'pdf' || kind === 'mindmap'
}

export function previewKind(url: string): DocumentKind {
  return resolveDocumentKind(url)
}

// Position de l'infobulle : à droite de l'élément survolé, légèrement remontée.
export function previewPositionFrom(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect()
  return { x: rect.right + 12, y: rect.top - 8 }
}

// Un mindmap se zoome et se déplace dans son infobulle : celle-ci doit donc survivre à
// la traversée du pointeur entre le libellé et elle. D'où la fermeture différée,
// annulée dès que le pointeur entre dans l'infobulle.
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
  apiUrl: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function PreviewTooltip({ state, apiUrl, onMouseEnter, onMouseLeave }: TooltipProps) {
  if (!state) return null

  const content = (() => {
    const url = resolveUploadUrl(state.url, apiUrl)
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
          <MindmapView url={url} apiUrl={apiUrl} />
        </div>
      )
    return null
  })()

  if (!content) return null

  // Seul le mindmap se manipule ; les autres formes restent transparentes au pointeur,
  // pour ne pas masquer la liste qu'on est en train de survoler.
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

// Style appliqué au nom d'un document dont l'aperçu est disponible.
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
  // Seule ombre portée du dépôt. Un noir fixe est invisible sur le fond du thème sombre :
  // dérivée de la couleur de texte, elle s'inverse avec le thème. Même motif qu'en dataBinding.
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
