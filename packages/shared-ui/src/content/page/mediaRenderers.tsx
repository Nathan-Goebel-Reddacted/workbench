import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { resolveDocumentKind, resolveUploadUrl } from '../media/documentKind'
import { isEmbeddedVideo, isUnplayableFile, resolveVideoSource } from '../media/videoSource'
import { MindmapView } from '../mindmap/MindmapView'
import { EditingContext } from './interactiveRenderers'
import type { MediaComponent, MediaFileRef } from './pageTypes'

const VIDEO_PERMISSIONS = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture'

export const ShownSlideContext = createContext<number | null>(null)

export function MediaView({ files, fit, position }: MediaComponent) {
  const apiUrl = useApiUrl()
  const forced = useContext(ShownSlideContext)
  const shown = files.filter(file => file.url)
  const style: CSSProperties = { ...fillStyle, objectFit: fit, objectPosition: position }
  if (shown.length === 0) return null
  if (shown.length === 1)
    return <MediaFile url={resolveUploadUrl(shown[0].url ?? '', apiUrl)} alt={shown[0].alt} style={style} />
  const pinned = forced === null ? null : shown.indexOf(files[forced])
  return <MediaSlides files={shown} pinned={pinned === -1 ? null : pinned} style={style} />
}

type SlidesProps = { files: readonly MediaFileRef[]; pinned: number | null; style: CSSProperties }

function MediaSlides({ files, pinned, style }: SlidesProps) {
  const apiUrl = useApiUrl()
  const editing = useContext(EditingContext)
  const reducedMotion = usePrefersReducedMotion()
  const [current, setCurrent] = useState(0)
  const slide = useRef<HTMLDivElement>(null)
  const index = (pinned ?? current) % files.length
  const file = files[index]

  useEffect(() => {
    if (reducedMotion) return
    slide.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' })
  }, [index, reducedMotion])

  const go = (next: number) => setCurrent((next + files.length) % files.length)
  const control = (next: number) => (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    go(next)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') go(index - 1)
    else if (event.key === 'ArrowRight') go(index + 1)
    else return
    event.preventDefault()
    event.stopPropagation()
  }
  const focusable = editing ? -1 : 0

  return (
    <div
      role="group"
      aria-roledescription="carrousel"
      aria-label={`Médias, ${index + 1} sur ${files.length}`}
      tabIndex={focusable}
      onKeyDown={onKeyDown}
      style={slidesStyle}
    >
      <div ref={slide} key={index} style={slideStyle} aria-live={editing ? undefined : 'polite'}>
        <MediaFile url={resolveUploadUrl(file.url ?? '', apiUrl)} alt={file.alt} style={style} />
      </div>
      <button
        type="button"
        aria-label="Média précédent"
        tabIndex={focusable}
        onClick={control(index - 1)}
        style={{ ...arrowStyle, left: '0.5rem' }}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Média suivant"
        tabIndex={focusable}
        onClick={control(index + 1)}
        style={{ ...arrowStyle, right: '0.5rem' }}
      >
        ›
      </button>
      <div style={dotsStyle}>
        {files.map((_, dot) => (
          <button
            key={dot}
            type="button"
            aria-label={`Afficher le média ${dot + 1}`}
            aria-current={dot === index ? 'true' : undefined}
            tabIndex={focusable}
            onClick={control(dot)}
            style={{ ...dotStyle, backgroundColor: dot === index ? 'var(--color-primary)' : 'var(--color-border)' }}
          />
        ))}
      </div>
    </div>
  )
}

function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches)
  useEffect(() => {
    const list = window.matchMedia?.(query)
    if (!list) return
    const update = () => setReduced(list.matches)
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [])
  return reduced
}

function MediaFile({ url, alt, style }: { url: string; alt: string; style: CSSProperties }) {
  const kind = resolveDocumentKind(url)

  if (kind === 'mindmap') {
    return (
      <div style={style}>
        <MindmapView url={url} pannable />
      </div>
    )
  }

  if (kind === 'pdf') return <iframe src={url} title={alt || 'PDF'} style={{ ...style, border: 'none' }} />

  if (kind === 'video') {
    const source = resolveVideoSource(url)
    if (isEmbeddedVideo(source)) {
      return (
        <iframe
          src={source.src}
          title={alt || source.label}
          allow={VIDEO_PERMISSIONS}
          allowFullScreen
          style={{ ...style, border: 'none' }}
        />
      )
    }
    if (isUnplayableFile(source)) return null
    return <video src={source.src} style={style} controls muted preload="metadata" />
  }

  if (kind === 'empty' || kind === 'unknown') return null

  return <img src={url} alt={alt} style={style} />
}

const fillStyle: CSSProperties = { display: 'block', width: '100%', height: '100%' }
const slidesStyle: CSSProperties = { position: 'relative', width: '100%', height: '100%', outlineOffset: '-2px' }
const slideStyle: CSSProperties = { width: '100%', height: '100%' }
const arrowStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: '50%',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '1.25rem',
  lineHeight: 1,
  cursor: 'pointer',
}
const dotsStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '0.5rem',
  display: 'flex',
  justifyContent: 'center',
  gap: '0.375rem',
}
const dotStyle: CSSProperties = {
  width: '0.5rem',
  height: '0.5rem',
  padding: 0,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
}
