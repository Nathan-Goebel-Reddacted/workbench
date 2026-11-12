import type { CSSProperties, ReactNode } from 'react'

// Le gabarit de toute page du site : borné et centré plutôt qu'étalé sur toute la largeur,
// comme les pages privées. La hauteur de ligne de la grille suit la largeur du conteneur
// (gridGeometry), donc un bloc garde son rapport quelle que soit la largeur de rendu.
//
// flex plutôt que 100vh : la NavBar occupe déjà le haut de #root (flex column), sinon la page
// dépasserait la fenêtre de la hauteur de la barre.
//
// `fill` : pour une page dont le contenu se dimensionne sur la hauteur restante plutôt que sur
// son propre flux — le visionneur de CV en déduit sa largeur de sa hauteur. Le contenu s'y
// centre lui-même, la largeur n'est donc pas bornée.
export function PageShell({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  return <main style={fill ? fillStyle : shellStyle}>{children}</main>
}

const shellStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  maxWidth: '1100px',
  margin: '0 auto',
  // Les marges suivent la largeur disponible : 2rem sur un écran, 1rem sur un téléphone,
  // sans palier à choisir ni media query — impossible dans un style en ligne.
  padding: 'clamp(1rem, 4vw, 2rem)',
  backgroundColor: 'var(--color-bg)',
}

const fillStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  padding: 'clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)',
  backgroundColor: 'var(--color-bg)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem',
}
