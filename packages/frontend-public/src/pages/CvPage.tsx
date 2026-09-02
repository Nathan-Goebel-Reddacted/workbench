import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { resolveUploadUrl } from '@atelier/content-renderer'
import { ErrorMessage, LoadingMessage, type LoadStatus } from '../components/PageStatus'
import { fetchJson } from '../lib/fetchJson'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type CvDto = {
  id: string
  name: string
  fileUrl: string
  visible: boolean
  displayOrder: number
}

export function CvPage() {
  useDocumentTitle('CV')
  const [cvs, setCvs] = useState<CvDto[]>([])
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    setStatus('loading')
    fetchJson<CvDto[]>(`${API_URL}/cvs`, controller.signal)
      .then(data => {
        setCvs((data ?? []).filter(cv => cv.visible).sort((a, b) => a.displayOrder - b.displayOrder))
        setStatus('ready')
      })
      .catch(err => {
        if (err.name !== 'AbortError') setStatus('error')
      })

    return () => controller.abort()
  }, [attempt])

  if (status === 'loading') return <LoadingMessage />
  if (status === 'error') return <ErrorMessage onRetry={() => setAttempt(n => n + 1)} />

  if (cvs.length === 0) {
    return (
      <div style={pageStyle}>
        <p style={emptyStyle}>Aucun CV disponible pour le moment.</p>
      </div>
    )
  }

  const current = cvs[Math.min(index, cvs.length - 1)]
  const move = (step: number) => setIndex(prev => (prev + step + cvs.length) % cvs.length)
  const hasSeveral = cvs.length > 1

  return (
    <div style={pageStyle}>
      <div style={selectorStyle}>
        {hasSeveral && (
          <Button variant="secondary" onClick={() => move(-1)} aria-label="CV précédent" style={arrowStyle}>
            <Chevron direction="left" />
          </Button>
        )}
        <span style={currentNameStyle}>{current.name}</span>
        {hasSeveral && (
          <Button variant="secondary" onClick={() => move(1)} aria-label="CV suivant" style={arrowStyle}>
            <Chevron direction="right" />
          </Button>
        )}
      </div>

      <div style={viewerStyle}>
        <iframe
          key={current.id}
          src={`${resolveUploadUrl(current.fileUrl, API_URL)}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit`}
          title={current.name}
          style={frameStyle}
        />
        <a
          href={resolveUploadUrl(current.fileUrl, API_URL)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Ouvrir ${current.name} dans un nouvel onglet`}
          style={frameOverlayStyle}
        />
      </div>
    </div>
  )
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  )
}

const pageStyle: CSSProperties = {
  minHeight: 'calc(100vh - 56px)',
  padding: '2rem 1.5rem',
  backgroundColor: 'var(--color-bg)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem',
}

const emptyStyle: CSSProperties = {
  fontSize: '0.9375rem',
  color: 'var(--color-text-muted)',
}

const selectorStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5rem',
  minWidth: 'min(420px, 100%)',
}

const arrowStyle: CSSProperties = {
  width: '2.5rem',
  height: '2.5rem',
  padding: 0,
  borderRadius: '50%',
}

const currentNameStyle: CSSProperties = {
  flex: 1,
  textAlign: 'center',
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--color-text)',
}

const viewerStyle: CSSProperties = {
  position: 'relative',
  height: 'calc(100vh - 200px)',
  aspectRatio: '1 / 1.414',
  maxWidth: '100%',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  overflow: 'hidden',
}

const frameStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  pointerEvents: 'none',
}

const frameOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  cursor: 'pointer',
}
