import type { CSSProperties } from 'react'
import { useApiUrl } from '../../config/ApiUrlContext'
import { resolveDocumentKind, resolveUploadUrl } from '../media/documentKind'
import { isEmbeddedVideo, isUnplayableFile, resolveVideoSource } from '../media/videoSource'
import { MindmapView } from '../mindmap/MindmapView'
import type { CarouselComponent, MediaComponent } from './pageTypes'

const VIDEO_PERMISSIONS = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture'

export function MediaView({ url, alt, fit, position }: MediaComponent) {
  const apiUrl = useApiUrl()
  if (!url) return null
  return (
    <MediaFile
      url={resolveUploadUrl(url, apiUrl)}
      alt={alt}
      style={{ ...fillStyle, objectFit: fit, objectPosition: position }}
    />
  )
}

export function CarouselView({ items }: CarouselComponent) {
  const apiUrl = useApiUrl()
  const slides = items.filter(item => item.url)
  if (slides.length === 0) return null
  return (
    <div style={carouselStyle}>
      {slides.map((item, index) => (
        <figure key={index} style={slideStyle}>
          <MediaFile url={resolveUploadUrl(item.url ?? '', apiUrl)} alt={item.caption} style={slideMediaStyle} />
          {item.caption && <figcaption style={captionStyle}>{item.caption}</figcaption>}
        </figure>
      ))}
    </div>
  )
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
const carouselStyle: CSSProperties = { display: 'flex', gap: '0.5rem', height: '100%', overflowX: 'auto' }
const slideStyle: CSSProperties = {
  margin: 0,
  height: '100%',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}
const slideMediaStyle: CSSProperties = {
  display: 'block',
  flex: 1,
  minHeight: 0,
  height: '100%',
  width: 'auto',
  aspectRatio: 'auto',
  objectFit: 'cover',
}
const captionStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-text-muted)' }
