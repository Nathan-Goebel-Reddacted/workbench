import { defaultPalette, type ThemeColors } from '@-reddacted-/react-ui'

// Le socle du package plus le vocabulaire propre à Workbench : la palette du mindmap,
// dont le format de fichier ne stocke qu'un nom de jeton, et la primaire douce.
// Un thème enregistré ne pilote que les sept couleurs de l'éditeur ; ces valeurs-ci
// sont le fond sur lequel il s'applique.
export const workbenchPalette: ThemeColors = {
  ...defaultPalette,
  '--color-primary-soft': '#e0e7ff',
  '--color-mindmap-red': '#dc2626',
  '--color-mindmap-red-soft': '#fee2e2',
  '--color-mindmap-orange': '#ea580c',
  '--color-mindmap-orange-soft': '#ffedd5',
  '--color-mindmap-green': '#16a34a',
  '--color-mindmap-green-soft': '#dcfce7',
  '--color-mindmap-blue': '#2563eb',
  '--color-mindmap-blue-soft': '#dbeafe',
  '--color-mindmap-purple': '#9333ea',
  '--color-mindmap-purple-soft': '#f3e8ff',
}
