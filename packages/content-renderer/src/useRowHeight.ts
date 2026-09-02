import { useLayoutEffect, useState, type RefObject } from 'react'
import { REFERENCE_WIDTH, rowHeightFor } from './gridGeometry'

// Hauteur de ligne courante d'une grille, déduite de la largeur réelle de son conteneur.
// useLayoutEffect plutôt que useEffect : la première mesure est prise avant la peinture,
// sinon la grille s'afficherait un instant à la hauteur de référence puis sauterait.
export function useRowHeight(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(REFERENCE_WIDTH)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = (value: number) => {
      // Une largeur nulle est un conteneur pas encore posé, pas une grille écrasée :
      // on garde la dernière valeur connue plutôt que d'aplatir tous les blocs.
      if (value > 0) setWidth(value)
    }

    measure(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(entries => measure(entries[0]?.contentRect.width ?? 0))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return rowHeightFor(width)
}
