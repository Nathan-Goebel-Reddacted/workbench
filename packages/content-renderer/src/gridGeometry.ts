// Géométrie partagée par la zone d'édition (GridCanvas) et la colonne d'aperçu
// (LayoutPreview). Source unique de vérité : les deux vues doivent positionner
// les sections avec des coordonnées strictement identiques (1:1).

export const COLS = 12
export const GAP = 8

// Largeur de composition de référence : celle de la page publique (HomePage borne la grille
// à 1100px). Elle ne contraint aucun rendu — elle sert uniquement à figer le rapport d'une
// cellule, pour que les layouts déjà composés gardent les proportions qu'on leur a données.
export const REFERENCE_WIDTH = 1100
export const REFERENCE_ROW_HEIGHT = 80

// Une cellule garde le même rapport hauteur/largeur quelle que soit la largeur de rendu.
// C'est la condition pour que la zone d'édition, l'aperçu et la page publique montrent la
// même chose : les colonnes étant en pourcentage, une hauteur de ligne fixe étirait ou
// aplatissait tout bloc dès que le conteneur n'avait pas la largeur de référence.
export const CELL_RATIO = REFERENCE_ROW_HEIGHT / (REFERENCE_WIDTH / COLS)

// Le GAP, lui, reste en pixels fixes, comme dans colToPercent et widthPercent : c'est une
// respiration entre blocs, pas une part de la maille.
export function rowHeightFor(width: number): number {
  if (width <= 0) return REFERENCE_ROW_HEIGHT
  return (width / COLS) * CELL_RATIO
}

export function gridHeightFor(maxRow: number, rowHeight: number): number {
  return maxRow * (rowHeight + GAP) + GAP
}

export function colToPercent(x: number): string {
  return `calc(${(x / COLS) * 100}% + ${GAP / 2}px)`
}

export function widthPercent(w: number): string {
  return `calc(${(w / COLS) * 100}% - ${GAP}px)`
}

// Respiration entre un fond et ce qui est posé dessus : seuls les widgets se resserrent.
// Sans cet écart, un widget et un fond posés sur les mêmes cellules ont des bords
// strictement confondus et le contenu colle au fond.
//
// L'outset du fond vaut exactement GAP / 2, et cette valeur n'est pas un réglage à l'œil :
// c'est la seule pour laquelle un widget est à la même distance du bord d'un fond qu'il
// soit dedans ou à côté.
//
//   intérieur (widget posé sur le fond)   = INSET + OUTSET
//   extérieur (widget voisin du fond)     = GAP - OUTSET + INSET
//   égalité                               => OUTSET = GAP / 2
//
// Sans ça, le bas d'une image affleurait le bord du fond à 4px quand un fond s'arrêtait à
// la même ligne, contre 12px quand il n'y en avait pas — visible d'un bloc à l'autre.
// Un outset plus grand (6) faisait l'inverse : le fond empiétait sur ses voisins.
//
// L'inset suffit à garder un fond attrapable au drag dans la zone d'édition, même
// entièrement recouvert : les widgets posés dessus le laissent dépasser.
export const WIDGET_INSET = 4
export const BACKGROUND_OUTSET = GAP / 2

// grow > 0 agrandit le bloc dans les quatre directions, grow < 0 le resserre.
export function sectionBox(section: { x: number; y: number; w: number; h: number }, grow: number, rowHeight: number) {
  return {
    left: `calc(${colToPercent(section.x)} - ${grow}px)`,
    top: section.y * (rowHeight + GAP) - grow,
    width: `calc(${widthPercent(section.w)} + ${2 * grow}px)`,
    height: section.h * rowHeight + (section.h - 1) * GAP + 2 * grow,
  }
}

// Écart à appliquer à une section selon son type, pour que l'édition, l'aperçu et la
// page publique produisent le même rendu.
// La zone cliquable prend l'outset du fond : posée sur les mêmes cellules qu'un fond,
// elle couvre exactement la même surface, donc tout le fond est cliquable.
export function growForType(type: string): number {
  return type === 'background' || type === 'linkArea' ? BACKGROUND_OUTSET : -WIDGET_INSET
}
