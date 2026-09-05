export type Theme = 'light' | 'dark'

// Palette dédiée au mindmap. Le format de fichier ne stocke qu'un nom de jeton
// (voir MindmapColor) : les valeurs vivent ici, donc un mindmap suit le thème.
// Chaque teinte a sa variante `-soft`, utilisée en remplissage.
export const themes = {
  light: {
    '--color-bg': '#ffffff',
    '--color-surface': '#f8fafc',
    '--color-text': '#1a1a1a',
    '--color-text-muted': '#64748b',
    '--color-primary': '#6366f1',
    '--color-primary-hover': '#4f46e5',
    // Couleur de contraste posée SUR la primaire (texte d'un bouton plein, par exemple) :
    // sans elle, chaque appelant retombait sur un blanc codé en dur.
    '--color-on-primary': '#ffffff',
    '--color-primary-soft': '#e0e7ff',
    '--color-border': '#e2e8f0',
    '--color-danger': '#dc2626',
    '--color-danger-soft': '#fee2e2',
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
  },
  dark: {
    '--color-bg': '#0f0f0f',
    '--color-surface': '#1e1e1e',
    '--color-text': '#f1f5f9',
    '--color-text-muted': '#94a3b8',
    '--color-primary': '#818cf8',
    '--color-primary-hover': '#6366f1',
    // La primaire du thème sombre est nettement plus claire : du blanc dessus ne passerait pas.
    '--color-on-primary': '#1e1b4b',
    '--color-primary-soft': '#1e1b4b',
    '--color-border': '#2d2d2d',
    '--color-danger': '#e05252',
    '--color-danger-soft': '#3f1d1d',
    '--color-mindmap-red': '#f87171',
    '--color-mindmap-red-soft': '#3f1d1d',
    '--color-mindmap-orange': '#fb923c',
    '--color-mindmap-orange-soft': '#3d2313',
    '--color-mindmap-green': '#4ade80',
    '--color-mindmap-green-soft': '#14331f',
    '--color-mindmap-blue': '#60a5fa',
    '--color-mindmap-blue-soft': '#16263f',
    '--color-mindmap-purple': '#c084fc',
    '--color-mindmap-purple-soft': '#2b1740',
  },
} satisfies Record<Theme, Record<string, string>>
