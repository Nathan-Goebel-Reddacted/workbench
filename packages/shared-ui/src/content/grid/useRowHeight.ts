import { useElementSize } from '@-reddacted-/react-hooks'
import { useRef, type RefObject } from 'react'
import { REFERENCE_WIDTH, rowHeightFor } from './gridGeometry'

// Hauteur de ligne courante d'une grille, déduite de la largeur réelle de son conteneur.
export function useRowHeight(ref: RefObject<HTMLElement | null>): number {
  const size = useElementSize(ref)

  // Une largeur nulle est un conteneur pas encore posé ou masqué, pas une grille écrasée :
  // on garde la dernière valeur connue plutôt que d'aplatir tous les blocs.
  const lastWidth = useRef(REFERENCE_WIDTH)
  if (size && size.width > 0) lastWidth.current = size.width

  return rowHeightFor(lastWidth.current)
}
