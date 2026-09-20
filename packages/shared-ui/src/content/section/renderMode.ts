// « edit » : colonne d'aperçu de l'éditeur — cadre, fond de panneau, et les états vides
// restent visibles pour guider la composition.
// « public » : rendu du site — pleine largeur sans cadre, et tout ce qui n'a pas de contenu
// réel disparaît plutôt que d'afficher un placeholder d'administration.
export type RenderMode = 'edit' | 'public'
