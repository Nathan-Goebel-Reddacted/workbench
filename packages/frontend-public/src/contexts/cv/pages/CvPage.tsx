import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Button } from '@atelier/shared-ui'
import { PageShell } from '../../../shared/components/PageShell'
import { Async } from '../../../shared/components/PageStatus'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import { usePublishedCvs } from '../hooks/usePublishedCvs'
import type { Cv } from '../types'

export function CvPage() {
  useDocumentTitle('CV')
  const { cvs, status, retry } = usePublishedCvs()

  return (
    <Async status={status} onRetry={retry}>
      {() => (
        <PageShell fill>
          {cvs.length === 0 ? <p style={emptyStyle}>Aucun CV disponible pour le moment.</p> : <Viewer cvs={cvs} />}
        </PageShell>
      )}
    </Async>
  )
}

function Viewer({ cvs }: { cvs: Cv[] }) {
  const [index, setIndex] = useState(0)
  const current = cvs[Math.min(index, cvs.length - 1)]
  const move = (step: number) => setIndex(prev => (prev + step + cvs.length) % cvs.length)
  const hasSeveral = cvs.length > 1

  return (
    <>
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
          src={`${current.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit`}
          title={current.name}
          style={frameStyle}
        />
        <a
          href={current.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Ouvrir ${current.name} dans un nouvel onglet`}
          style={frameOverlayStyle}
        />
      </div>
    </>
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

// Le visionneur prend la hauteur qui reste ; le rapport A4 en déduit sa largeur.
const viewerStyle: CSSProperties = {
  position: 'relative',
  flex: 1,
  minHeight: 0,
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
