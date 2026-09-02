import { useRef, type CSSProperties } from 'react'
import { SectionPreview } from './SectionPreview'
import { gridHeightFor, sectionBox, growForType } from './gridGeometry'
import { useRowHeight } from './useRowHeight'
import { computeBackgroundDepths, zIndexFor } from './backgroundStacking'
import type { SectionDto } from './types'
import type { RenderMode } from './renderMode'

type LayoutPreviewProps = {
  apiUrl: string
  sections: SectionDto[]
  mode?: RenderMode
}

// Rendu final assemblé, en lecture seule. Positionne chaque section aux mêmes
// coordonnées que la zone d'édition (géométrie partagée) et délègue le rendu du
// contenu à SectionPreview. Aucune interaction : ni drag, ni resize, ni actions.
export function LayoutPreview({ apiUrl, sections, mode = 'edit' }: LayoutPreviewProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  // La hauteur d'une ligne suit la largeur du conteneur : le panneau d'aperçu est étroit,
  // la page publique large, et les deux doivent rendre le même bloc au même rapport.
  const rowHeight = useRowHeight(surfaceRef)
  const maxRow = sections.reduce((max, s) => Math.max(max, s.y + s.h), 4)
  const height = gridHeightFor(maxRow, rowHeight)
  // Sans z-index explicite, l'ordre du DOM ferait passer un fond ajouté en dernier
  // par-dessus les widgets qu'il est censé habiller.
  const depths = computeBackgroundDepths(sections)

  return (
    <div ref={surfaceRef} style={{ ...(mode === 'public' ? publicSurfaceStyle : surfaceStyle), minHeight: height }}>
      {mode === 'edit' && sections.length === 0 && <p style={emptyStyle}>L'aperçu s'affichera ici.</p>}
      {sections.map(section => (
        <div key={section.id} style={sectionStyle(section, zIndexFor(section, depths), rowHeight)}>
          <SectionPreview section={section} apiUrl={apiUrl} backgroundDepth={depths.get(section.id)} mode={mode} />
        </div>
      ))}
    </div>
  )
}

// Même écart fond / widget que la zone d'édition (voir gridGeometry) : sans lui, le
// contenu posé sur un fond collerait à ses bords dans l'aperçu et sur la page publique.
function sectionStyle(section: SectionDto, zIndex: number, rowHeight: number): CSSProperties {
  return {
    position: 'absolute',
    ...sectionBox(section, growForType(section.type), rowHeight),
    zIndex,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
  }
}

const surfaceStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  minWidth: 0,
  flex: 1,
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  overflow: 'hidden',
}

// Le rendu public occupe la page : ni cadre, ni arrondi, ni fond de panneau. La géométrie
// des sections, elle, reste strictement identique à celle de l'aperçu.
const publicSurfaceStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  minWidth: 0,
  backgroundColor: 'var(--color-bg)',
}

const emptyStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  margin: 0,
}
